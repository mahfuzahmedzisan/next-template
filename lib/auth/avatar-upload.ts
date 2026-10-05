import axios from "axios";

import type { User } from "@/types/auth";

type AvatarResponse = {
  message?: string;
  user: User;
};

export async function uploadAvatarWithProgress(options: {
  file: Blob;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<User> {
  const body = new FormData();
  body.append("avatar", options.file, "avatar.webp");

  try {
    const response = await axios.post<AvatarResponse>(
      "/api/profile/avatar",
      body,
      {
        signal: options.signal,
        onUploadProgress: (event) => {
          if (!event.total) return;
          options.onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        },
      },
    );

    return response.data.user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        "Unable to upload avatar.";
      throw new Error(message);
    }

    throw error;
  }
}

export async function deleteAvatarClient(): Promise<string> {
  try {
    const response = await axios.delete<AvatarResponse>("/api/profile/avatar");
    return response.data.message ?? "Avatar removed successfully.";
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        "Unable to remove avatar.";
      throw new Error(message);
    }

    throw error;
  }
}
