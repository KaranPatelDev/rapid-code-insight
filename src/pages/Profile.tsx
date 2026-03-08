import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Braces, ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);

    // Convert to base64 data URL and store directly
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: dataUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to upload avatar");
      } else {
        setAvatarUrl(dataUrl);
        toast.success("Avatar updated");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const initials = (displayName || user?.email?.split("@")[0] || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Profile" description="Manage your CodeLens AI profile settings." />
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
                <Braces className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            </Link>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Profile</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Profile Settings</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avatar</CardTitle>
                <CardDescription>Click the avatar to upload a new photo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Avatar className="h-20 w-20 border-2 border-border">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                      ) : null}
                      <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploading ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </button>
                  <div className="text-sm text-muted-foreground">
                    <p>JPG, PNG or WebP. Max 2MB.</p>
                    {memberSince && <p className="mt-1">Member since {memberSince}</p>}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your display name and account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
