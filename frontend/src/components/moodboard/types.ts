export interface MoodboardItem {
  id: string
  type: "outfit" | "moodboard"
  image_url: string
  caption: string | null
  name: string | null
  created_at: string
}

export interface PersonalMoodboard {
  id: number
  user_id: number
  items: MoodboardItem[]
  thumbnail_url: string | null
}

export interface UserMoodboard {
  user_id: number
  user_display_name: string
  user_avatar_url: string | null
  user_emoji: string | null
  items: MoodboardItem[]
  thumbnail_url: string | null
  item_count: number
}

export interface SharedMoodboard {
  users: UserMoodboard[]
  total_items: number
  threshold: number
  show_thumbnails: boolean
}
