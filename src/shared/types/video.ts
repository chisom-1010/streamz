export interface Video {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  genre?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface VideoView {
  id: string;
  videoId: string;
  userId?: string;
  watchTime: number;
  createdAt: string;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  genreId?: string;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  genreId?: string;
}
