import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useCreateCommunityPost, useDeleteCommunityPost } from "@workspace/api-client-react";
import { MessageSquare, Users, Trash2, Plus, Users2, Coffee, Car, WifiOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BARANGAYS } from "@/data/barangays";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityPost {
  id: number;
  author_name: string;
  post_type: "carpool" | "shared_table" | "general";
  barangay: string;
  message: string;
  contact_info?: string | null;
  seats_available?: number | null;
  created_at: string;
}

// ─── Local storage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "fiestamatic_bayanihan_posts";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function loadCached(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CommunityPost[];
  } catch {
    // ignore
  }
  return [];
}

function saveToCache(posts: CommunityPost[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore quota errors
  }
}

// ─── Mock seed data (only shown when local storage is empty) ──────────────────

const MOCK_POSTS: CommunityPost[] = [
  {
    id: -1,
    author_name: "Maria Santos",
    post_type: "carpool",
    barangay: "Candau-ay",
    message: "Driving from Rizal Blvd to Candau-ay fiesta on Aug 15! 3 seats available. Leave 8 AM from the boulevard.",
    contact_info: "09171234567",
    seats_available: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: -2,
    author_name: "Tatay Romy",
    post_type: "shared_table",
    barangay: "Camanjac",
    message: "We have extra lechon and kare-kare for the Camanjac fiesta! Everyone is welcome. Come hungry! 🎉",
    contact_info: null,
    seats_available: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: -3,
    author_name: "Ate Liza",
    post_type: "general",
    barangay: "Bagacay",
    message: "Is anyone else going to the Bagacay fiesta in September? Looking to coordinate a group visit from Silliman area!",
    contact_info: "Messenger: LizaDumaguete",
    seats_available: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

// ─── Offline-first hook ────────────────────────────────────────────────────────

function useBayanihanPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const cached = loadCached();
    return cached.length > 0 ? cached : MOCK_POSTS;
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncError, setSyncError] = useState(false);

  // Track online/offline
  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  // Fetch from server and merge into localStorage
  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/community/posts`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error("bad response");
      const serverPosts: CommunityPost[] = await res.json();
      setPosts(serverPosts);
      saveToCache(serverPosts);
      setSyncError(false);
    } catch {
      setSyncError(true);
      // keep whatever we have in state (already loaded from localStorage/mock)
    }
  }, []);

  // Sync on mount and when coming back online
  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    if (!isOffline) syncFromServer();
  }, [isOffline, syncFromServer]);

  // Derived summary (computed client-side — always available offline)
  const summary = {
    carpool_posts: posts.filter((p) => p.post_type === "carpool").length,
    shared_table_posts: posts.filter((p) => p.post_type === "shared_table").length,
    active_barangays: new Set(posts.map((p) => p.barangay)).size,
  };

  const addPost = useCallback((post: CommunityPost) => {
    setPosts((prev) => {
      const next = [post, ...prev];
      saveToCache(next);
      return next;
    });
  }, []);

  const removePost = useCallback((id: number) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveToCache(next);
      return next;
    });
  }, []);

  return { posts, summary, isOffline, syncError, addPost, removePost, syncFromServer };
}

// ─── Post schema ───────────────────────────────────────────────────────────────

const postSchema = z.object({
  author_name: z.string().min(1, "Name is required").max(100),
  post_type: z.enum(["carpool", "shared_table", "general"]),
  barangay: z.string().min(1, "Barangay is required"),
  message: z.string().min(1, "Message is required").max(500),
  contact_info: z.string().max(200).optional(),
  seats_available: z.coerce.number().min(1).max(20).optional().or(z.literal("")),
});

// ─── Main component ────────────────────────────────────────────────────────────

export default function Community() {
  const { posts, summary, isOffline, syncError, addPost, removePost } = useBayanihanPosts();
  const deletePost = useDeleteCommunityPost();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getPostIcon = (type: string) => {
    switch (type) {
      case "carpool": return <Car className="w-4 h-4" />;
      case "shared_table": return <Coffee className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPostColor = (type: string) => {
    switch (type) {
      case "carpool": return "bg-blue-100 text-blue-700 border-blue-200";
      case "shared_table": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-orange-100 text-orange-700 border-orange-200";
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    // Optimistically remove from local state
    removePost(id);
    // Best-effort server delete (only for real IDs, not mock negatives)
    if (id > 0) {
      deletePost.mutate({ id });
    }
  };

  return (
    <div className="pb-32 min-h-[100dvh] bg-background relative">
      {/* Hero header */}
      <div className="bg-primary pt-14 pb-6 px-5 rounded-b-[40px] text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        {/* Offline indicator inside hero */}
        {(isOffline || syncError) && (
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm text-white/90 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full w-fit mb-3">
            <WifiOff className="w-3 h-3" />
            {isOffline ? "Offline Mode — Using cached data" : "Server unreachable — Using cached data"}
          </div>
        )}

        <h1 className="text-4xl font-display font-extrabold mb-1 tracking-tight">Bayanihan Board</h1>
        <p className="text-primary-foreground/90 font-medium mb-6 leading-tight">Share a ride, share a table, share the fiesta spirit.</p>

        {/* Stats — always available, computed locally */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm text-center">
            <Car className="w-6 h-6 mb-2 opacity-90 mx-auto" />
            <div className="text-3xl font-display font-bold leading-none">{summary.carpool_posts}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">Carpools</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm text-center">
            <Coffee className="w-6 h-6 mb-2 opacity-90 mx-auto" />
            <div className="text-3xl font-display font-bold leading-none">{summary.shared_table_posts}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">Tables</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm text-center">
            <Users2 className="w-6 h-6 mb-2 opacity-90 mx-auto" />
            <div className="text-3xl font-display font-bold leading-none">{summary.active_barangays}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">Barangays</div>
          </div>
        </div>

        {/* Prominent new post button — inside hero, full width, right-thumb friendly */}
        <button
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-new-post"
          className="w-full bg-secondary text-secondary-foreground rounded-2xl py-4 px-5 flex items-center justify-center gap-3 font-display font-extrabold text-lg shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-[0.97] transition-transform border-2 border-white/30"
        >
          <Plus className="w-6 h-6 shrink-0" />
          Post to Bayanihan Board
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border mt-8 shadow-sm">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground font-bold">No posts yet.</p>
            <p className="text-muted-foreground/80 text-sm mt-1">Be the first to share the fiesta spirit!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-card border border-card-border p-5 rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] relative group transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 capitalize tracking-wide ${getPostColor(post.post_type)}`}>
                    {getPostIcon(post.post_type)}
                    {post.post_type.replace("_", " ")}
                  </div>
                  {post.seats_available && (
                    <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-1.5 rounded-lg border border-border">
                      {post.seats_available} seats
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  data-testid={`button-delete-post-${post.id}`}
                  className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-display font-bold text-xl mb-1.5 text-foreground">{post.barangay}</h3>
              <p className="text-card-foreground text-sm mb-5 leading-relaxed font-medium">{post.message}</p>

              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <div className="text-sm font-bold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                  {post.author_name}
                </div>
                <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              {post.contact_info && (
                <div className="mt-4 bg-muted/50 p-3 rounded-xl border border-border/50 text-sm font-medium flex items-center gap-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Contact:</span>
                  <span className="text-foreground">{post.contact_info}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">New Post</DialogTitle>
          </DialogHeader>
          <CreatePostForm
            onSuccess={(post) => {
              addPost(post);
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Create post form ──────────────────────────────────────────────────────────

function CreatePostForm({ onSuccess }: { onSuccess: (post: CommunityPost) => void }) {
  const createPost = useCreateCommunityPost();
  const [offlinePosted, setOfflinePosted] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      author_name: "",
      post_type: "general",
      barangay: "",
      message: "",
      contact_info: "",
      seats_available: "",
    },
  });

  const postType = form.watch("post_type");

  const onSubmit = (values: z.infer<typeof postSchema>) => {
    const payload = {
      ...values,
      seats_available: values.seats_available ? Number(values.seats_available) : undefined,
      contact_info: values.contact_info || undefined,
    };

    // Always create a local post immediately (offline-first)
    const localPost: CommunityPost = {
      id: Date.now(), // temporary local ID (positive, unique enough)
      author_name: payload.author_name,
      post_type: payload.post_type,
      barangay: payload.barangay,
      message: payload.message,
      contact_info: payload.contact_info ?? null,
      seats_available: payload.seats_available ?? null,
      created_at: new Date().toISOString(),
    };

    // If online, try to persist to server; use server ID if it succeeds
    if (navigator.onLine) {
      createPost.mutate(
        { data: payload },
        {
          onSuccess: (serverPost) => {
            // Replace local ID with server's real ID
            const confirmed: CommunityPost = { ...localPost, id: (serverPost as CommunityPost).id ?? localPost.id };
            form.reset();
            onSuccess(confirmed);
          },
          onError: () => {
            // Server failed but we still save locally
            form.reset();
            onSuccess(localPost);
          },
        }
      );
    } else {
      setOfflinePosted(true);
      form.reset();
      setTimeout(() => {
        onSuccess(localPost);
      }, 800);
    }
  };

  if (offlinePosted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <WifiOff className="w-10 h-10 text-muted-foreground" />
        <p className="font-display font-bold text-lg text-foreground text-center">Saved locally!</p>
        <p className="text-sm text-muted-foreground text-center leading-snug">
          Your post is saved on this device. It will sync to the community board when you're back online.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2 max-h-[70vh] overflow-y-auto px-1 pb-4 scrollbar-none">
      <div className="space-y-2.5">
        <label className="text-sm font-bold text-foreground">I want to...</label>
        <div className="grid grid-cols-3 gap-2">
          {["general", "carpool", "shared_table"].map((type) => (
            <label
              key={type}
              className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all
                ${postType === type ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:bg-muted/50"}`}
            >
              <input type="radio" value={type} className="sr-only" {...form.register("post_type")} />
              {type === "carpool" ? <Car className="w-5 h-5" /> : type === "shared_table" ? <Coffee className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-center">{type.replace("_", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">Your Name</label>
        <input
          {...form.register("author_name")}
          data-testid="input-author-name"
          className="w-full border-2 border-border rounded-xl p-3 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
          placeholder="Juan Dela Cruz"
        />
        {form.formState.errors.author_name && <p className="text-xs text-destructive font-bold">{form.formState.errors.author_name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">Target Barangay</label>
        <select
          {...form.register("barangay")}
          data-testid="select-barangay"
          className="w-full border-2 border-border rounded-xl p-3 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium appearance-none"
        >
          <option value="">Select a barangay...</option>
          {BARANGAYS.map((b) => (
            <option key={b.barangay} value={b.barangay}>{b.barangay}</option>
          ))}
        </select>
        {form.formState.errors.barangay && <p className="text-xs text-destructive font-bold">{form.formState.errors.barangay.message}</p>}
      </div>

      {postType === "carpool" && (
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Seats Available</label>
          <input
            type="number"
            {...form.register("seats_available")}
            data-testid="input-seats-available"
            className="w-full border-2 border-border rounded-xl p-3 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
            placeholder="e.g., 4"
            min="1"
            max="20"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">Message</label>
        <textarea
          {...form.register("message")}
          data-testid="textarea-message"
          className="w-full border-2 border-border rounded-xl p-3 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium min-h-[100px] resize-none"
          placeholder="What are you offering or looking for?"
        />
        {form.formState.errors.message && <p className="text-xs text-destructive font-bold">{form.formState.errors.message.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground flex items-center justify-between">
          Contact Info
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-md">Optional</span>
        </label>
        <input
          {...form.register("contact_info")}
          data-testid="input-contact-info"
          className="w-full border-2 border-border rounded-xl p-3 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
          placeholder="Phone number, Messenger link, etc."
        />
      </div>

      <button
        type="submit"
        data-testid="button-submit-post"
        disabled={createPost.isPending}
        className="w-full bg-primary text-primary-foreground rounded-xl p-4 font-bold mt-2 shadow-md hover-elevate transition-transform active:scale-[0.98] disabled:opacity-50 text-base"
      >
        {createPost.isPending ? "Posting..." : "Post to Board"}
      </button>
    </form>
  );
}
