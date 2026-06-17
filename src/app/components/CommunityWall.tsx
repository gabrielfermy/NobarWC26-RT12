"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface CommunityWallProps {
  user: any;
  profile: any;
}

export function CommunityWall({ user, profile }: CommunityWallProps) {
  const [comments, setComments] = useState<{ id: string; name: string; message: string; created_at: string }[]>([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentMessage, setNewCommentMessage] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from("community_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setComments(data);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  }

  useEffect(() => {
    loadComments();
    generateCaptcha();

    const commentsChannel = supabase
      .channel("comments-realtime-wall")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  useEffect(() => {
    if (profile?.name) {
      setNewCommentName(profile.name);
    }
  }, [profile]);

  const handlePostComment = async () => {
    if (!newCommentName.trim()) {
      alert("Nama tidak boleh kosong!");
      return;
    }
    if (!newCommentMessage.trim()) {
      alert("Pesan tidak boleh kosong!");
      return;
    }
    if (!user && captchaInput.toUpperCase() !== captchaCode) {
      alert("Kode CAPTCHA tidak cocok!");
      generateCaptcha();
      return;
    }

    try {
      const { error } = await supabase
        .from("community_messages")
        .insert({
          name: newCommentName.trim(),
          message: newCommentMessage.trim()
        });

      if (error) throw error;
      setNewCommentMessage("");
      generateCaptcha();
    } catch (err: any) {
      alert("Gagal mengirim pesan: " + err.message);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            Community Wall
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Dengarkan serunya suara warga RT 12 Pelem Kidul.</p>
        </div>

        {/* List of comments/wishes */}
        <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-lg">
              Belum ada pesan. Ayo jadi yang pertama menulis!
            </div>
          ) : (
            comments.map((comment) => {
              const initials = comment.name ? comment.name.substring(0, 1).toUpperCase() : "?";
              const formattedTime = new Date(comment.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
              }) + ", " + new Date(comment.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short"
              });

              const isAdmin = comment.name.toLowerCase().includes("admin");

              return (
                <div key={comment.id} className="bg-background/50 border border-border/30 p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-2">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                        isAdmin ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                      }`}>
                        {initials}
                      </div>
                      <span className={`font-bold ${isAdmin ? "text-accent" : "text-foreground"}`}>{comment.name}</span>
                      <span className="text-[8px] text-muted-foreground">• {formattedTime}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground/90 pl-7 leading-relaxed whitespace-pre-wrap">
                    {comment.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input Comment box & Captcha */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className={user ? "w-full" : "grid grid-cols-2 gap-2"}>
          <input
            type="text"
            placeholder="Nama Anda..."
            value={newCommentName}
            onChange={(e) => setNewCommentName(e.target.value)}
            disabled={!!profile?.name}
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-70 disabled:cursor-not-allowed"
          />
          {!user && (
            <div className="flex items-center space-x-1">
              <div className="bg-muted px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest text-primary border border-border select-none flex items-center justify-center flex-1 h-8">
                {captchaCode}
              </div>
              <input
                type="text"
                maxLength={4}
                placeholder="CAPTCHA"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-16 px-2 py-1.5 bg-background border border-input rounded-lg text-xs text-center uppercase placeholder-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-8"
              />
            </div>
          )}
        </div>
        <div className="flex space-x-2 items-center">
          <textarea
            placeholder="Tulis pesan warga..."
            rows={2}
            value={newCommentMessage}
            onChange={(e) => setNewCommentMessage(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
          />
          <Button
            onClick={handlePostComment}
            size="sm"
            className="h-10 text-[11px] font-bold bg-primary text-white px-4 shrink-0"
          >
            Kirim
          </Button>
        </div>
      </div>
    </div>
  );
}
