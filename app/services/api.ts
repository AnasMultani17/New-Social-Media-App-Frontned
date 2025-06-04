/** @format */

const API_BASE_URL = "https://socialmediaapp-backend-1.onrender.com/api/v1";

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async requestWithFormData(
    endpoint: string,
    formData: FormData,
    method = "POST"
  ) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

class AuthService extends ApiService {
  async register(userData: FormData) {
    return this.requestWithFormData("/users/register", userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.request("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request("/users/logout", { method: "POST" });
  }

  async getCurrentUser() {
    return this.request("/users/current-user");
  }

  async refreshToken() {
    return this.request("/users/refresh-token", { method: "POST" });
  }

  async changePassword(passwords: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.request("/users/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
  }

  async updateAccount(userData: any) {
    return this.request("/users/update-account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  }

  async updateAvatar(avatar: FormData) {
    return this.requestWithFormData("/users/avatar", avatar, "PATCH");
  }

  async updatecoverimage(coverimage: FormData) {
    return this.requestWithFormData("/users/coverimage", coverimage, "PATCH");
  }

  async getUserChannel(username: string) {
    return this.request(`/users/c/${username}`);
  }

  async getWatchHistory() {
    return this.request("/users/history");
  }

  async addToWatchHistory(videoId: string) {
    return this.request("/users/addVideoToWatchHistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }

  async clearWatchHistory() {
    return this.request("/users/clear-history", { method: "DELETE" });
  }

  async removeFromWatchHistory(videoId: string) {
    return this.request("/users/remove-from-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }
}

class VideoService extends ApiService {
  async uploadVideo(videoData: FormData) {
    return this.requestWithFormData("/videos", videoData);
  }

  async getVideos(params: {
    page?: number;
    limit?: number;
    query?: string;
    sortBy?: string;
    sortType?: string;
    userId?: string;
    published?: boolean;
    username?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/videos?${searchParams.toString()}`);
  }

  async getVideo(videoId: string) {
    return this.request(`/videos/v/${videoId}`);
  }

  async incrementViews(videoId: string) {
    return this.request(`/videos/v/${videoId}`, { method: "PATCH" });
  }

  async updateVideo(videoId: string, videoData: FormData) {
    return this.requestWithFormData(
      `/videos/uv/${videoId}`,
      videoData,
      "PATCH"
    );
  }

  async deleteVideo(videoId: string) {
    return this.request(`/videos/uv/${videoId}`, { method: "DELETE" });
  }

  async togglePublish(videoId: string) {
    return this.request(`/videos/uv/${videoId}/toggle-publish`, {
      method: "PATCH",
    });
  }
}

class TweetService extends ApiService {
  async createTweet(content: string) {
    return this.request("/tweets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async getUserTweets(userId: string) {
    return this.request(`/tweets/user/${userId}`);
  }

  async updateTweet(tweetId: string, content: string) {
    return this.request(`/tweets/${tweetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async deleteTweet(tweetId: string) {
    return this.request(`/tweets/${tweetId}`, { method: "DELETE" });
  }
}

class SubscriptionService extends ApiService {
  async toggleSubscription(channelId: string) {
    return this.request(`/subscribe/c/${channelId}`, { method: "POST" });
  }

  async getSubscribedChannels(channelId: string) {
    return this.request(`/subscribe/c/${channelId}`);
  }

  async getSubscribers(subscriptionId: string) {
    return this.request(`/subscribe/u/${subscriptionId}`);
  }

  async checkIfSubscribed(channelId: string) {
    return this.request(`/subscribe/check/${channelId}`);
  }
}

class PlaylistService extends ApiService {
  async createplaylist(data: { name: string; description: string }) {
    return this.request("/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async getUserplaylists(userId: string) {
    return this.request(`/playlist/user/${userId}`);
  }

  async getplaylist(playlistId: string) {
    return this.request(`/playlist/${playlistId}`);
  }

  async addVideoToplaylist(videoId: string, playlistId: string) {
    return this.request(`/playlist/add/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }

  async removeVideoFromplaylist(videoId: string, playlistId: string) {
    return this.request(`/playlist/remove/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }

  async updateplaylist(
    playlistId: string,
    data: { name: string; description: string }
  ) {
    return this.request(`/playlist/${playlistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteplaylist(playlistId: string) {
    return this.request(`/playlist/${playlistId}`, { method: "DELETE" });
  }
}

class LikeService extends ApiService {
  async toggleVideoLike(videoId: string) {
    return this.request(`/like/toggle/v/${videoId}`, { method: "POST" });
  }

  async toggleCommentLike(commentId: string) {
    return this.request(`/like/toggle/c/${commentId}`, { method: "POST" });
  }

  async toggleTweetLike(tweetId: string) {
    return this.request(`/like/toggle/t/${tweetId}`, { method: "POST" });
  }

  async getLikedVideos() {
    return this.request("/like/videos");
  }

  async checkIfVideoLiked(videoId: string) {
    return this.request(`/like/check/v/${videoId}`);
  }

  async checkIfCommentLiked(commentId: string) {
    return this.request(`/like/check/c/${commentId}`);
  }

  async checkIfTweetLiked(tweetId: string) {
    return this.request(`/like/check/t/${tweetId}`);
  }

  async getVideoLikesCount(videoId: string) {
    return this.request(`/like/count/v/${videoId}`);
  }

  async getCommentLikesCount(commentId: string) {
    return this.request(`/like/count/c/${commentId}`);
  }

  async getTweetLikesCount(tweetId: string) {
    return this.request(`/like/count/t/${tweetId}`);
  }
}

class CommentService extends ApiService {
  async getVideoComments(
    videoId: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortType?: string;
    }
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    return this.request(`/comment/${videoId}?${searchParams.toString()}`);
  }

  async addComment(videoId: string, content: string) {
    return this.request(`/comment/${videoId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async updateComment(commentId: string, content: string) {
    return this.request(`/comment/c/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string) {
    return this.request(`/comment/c/${commentId}`, { method: "DELETE" });
  }
}

class DashboardService extends ApiService {
  async getChannelStats() {
    return this.request("/dashboard/stats");
  }

  async getChannelVideos() {
    return this.request("/dashboard/videos");
  }
}

export const authService = new AuthService();
export const videoService = new VideoService();
export const tweetService = new TweetService();
export const subscriptionService = new SubscriptionService();
export const playlistService = new PlaylistService();
export const likeService = new LikeService();
export const commentService = new CommentService();
export const dashboardService = new DashboardService();
