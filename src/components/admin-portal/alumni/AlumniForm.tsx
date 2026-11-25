"use client";

import { Alumni } from "@/models/Alumnus";
import { MatchImage } from "@/components/matches/MatchImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import uploadFile, {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
} from "@/lib/uploadFile";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AlumniFormProps {
  alumniId?: string;
}

const inputClass = cn(
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
);

const labelClass = "text-sm font-medium text-foreground";

const AlumniForm = ({ alumniId }: AlumniFormProps) => {
  const [message, setMessage] = useState({
    error: false,
    success: false,
    message: "",
  });

  const [alumniDetails, setAlumniDetails] = useState({
    name: "",
    linkedin: "",
    profile_image: "",
    position: "",
    session_start: new Date().getFullYear() - 4,
    session_end: new Date().getFullYear(),
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAlumni = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/alumnus/${id}`);
      if (response.ok) {
        const data = await response.json();
        const alumniData = data.data as Alumni;
        setAlumniDetails({
          name: alumniData.name,
          profile_image: alumniData.profile_image,
          linkedin: alumniData.linkedin,
          position: alumniData.position,
          session_start: alumniData.session_start,
          session_end: alumniData.session_end,
        });
      }
    } catch (error) {
      console.error("Error loading alumni:", error);
    }
  };

  useEffect(() => {
    if (alumniId) {
      loadAlumni(alumniId);
    }
  }, [alumniId]);

  const handleOnSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(
        alumniId ? `/api/v1/alumnus/${alumniId}` : "/api/v1/alumnus/",
        {
          method: alumniId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alumniDetails),
        }
      );

      if (response.ok) {
        setMessage({
          error: false,
          success: true,
          message: alumniId
            ? "Alumni updated successfully."
            : "Alumni created successfully.",
        });

        if (!alumniId) {
          setAlumniDetails({
            name: "",
            profile_image: "",
            linkedin: "",
            position: "",
            session_start: new Date().getFullYear() - 4,
            session_end: new Date().getFullYear(),
          });
          setFile(null);
        }
      } else {
        setMessage({
          error: true,
          success: false,
          message: `Failed to ${alumniId ? "update" : "create"} alumni.`,
        });
      }
    } catch (error: unknown) {
      setMessage({
        error: true,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${alumniId ? "update" : "create"} alumni.`,
      });
    }
  };

  const handleOnReset = () => {
    setAlumniDetails({
      name: "",
      profile_image: "",
      linkedin: "",
      position: "",
      session_start: new Date().getFullYear() - 4,
      session_end: new Date().getFullYear(),
    });
    setFile(null);
    setMessage({ error: false, success: false, message: "" });
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const validationError = validateImageFile(selected);
    if (validationError) {
      setFile(null);
      event.target.value = "";
      setMessage({
        error: true,
        success: false,
        message: validationError,
      });
      return;
    }

    setMessage({ error: false, success: false, message: "" });
    setFile(selected);
  };

  const onFileUpload = async () => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage({
        error: true,
        success: false,
        message: validationError,
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadFile(file, "/alumni", {
        maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
        allowedTypes: ALLOWED_IMAGE_MIME_TYPES,
      });
      if (imageUrl) {
        setAlumniDetails((prev) => ({ ...prev, profile_image: imageUrl }));
        setFile(null);
      } else {
        setMessage({
          error: true,
          success: false,
          message: "Failed to upload image.",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage({
        error: true,
        success: false,
        message: "Failed to upload image.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border/80">
      <CardContent className="space-y-6 pt-6">
        {message.error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {message.message}
          </p>
        )}
        {message.success && (
          <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
            {message.message}
          </p>
        )}

        {alumniDetails.profile_image && (
          <div className="flex items-center gap-4">
            <MatchImage
              src={alumniDetails.profile_image}
              alt="Profile preview"
              className="h-16 w-16 rounded-full border border-border object-cover"
              size={200}
              fallback={<span className="text-xs">?</span>}
            />
            <p className="text-xs text-muted-foreground">Profile photo preview</p>
          </div>
        )}

        <form className="grid gap-4" onSubmit={handleOnSubmit} onReset={handleOnReset}>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="name">
              Name
            </label>
            <input
              className={inputClass}
              type="text"
              id="name"
              required
              placeholder="Full name"
              value={alumniDetails.name}
              onChange={(e) =>
                setAlumniDetails({ ...alumniDetails, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="profile_image">
              Profile image URL
            </label>
            <input
              className={inputClass}
              type="url"
              id="profile_image"
              placeholder="https://..."
              value={alumniDetails.profile_image}
              onChange={(e) =>
                setAlumniDetails({
                  ...alumniDetails,
                  profile_image: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              id="alumniImageInput"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!file || uploading}
              onClick={onFileUpload}
            >
              {uploading ? "Uploading…" : "Upload image"}
            </Button>
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="position">
              Position
            </label>
            <input
              className={inputClass}
              type="text"
              id="position"
              placeholder="e.g. Cartoonist, Editor"
              value={alumniDetails.position}
              onChange={(e) =>
                setAlumniDetails({ ...alumniDetails, position: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="linkedin">
              LinkedIn URL
            </label>
            <input
              className={inputClass}
              type="url"
              id="linkedin"
              placeholder="https://linkedin.com/in/..."
              value={alumniDetails.linkedin}
              onChange={(e) =>
                setAlumniDetails({ ...alumniDetails, linkedin: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="session_start">
                Session start
              </label>
              <input
                className={inputClass}
                type="number"
                id="session_start"
                required
                value={alumniDetails.session_start}
                onChange={(e) =>
                  setAlumniDetails({
                    ...alumniDetails,
                    session_start: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="session_end">
                Session end
              </label>
              <input
                className={inputClass}
                type="number"
                id="session_end"
                required
                value={alumniDetails.session_end}
                onChange={(e) =>
                  setAlumniDetails({
                    ...alumniDetails,
                    session_end: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <Button type="reset" variant="outline">
              Clear
            </Button>
            <Button type="submit">{alumniId ? "Save changes" : "Create alumni"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AlumniForm;
