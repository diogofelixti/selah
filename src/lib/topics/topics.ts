import raw from '../../content/topics.json'

export type Localized = { pt: string; en: string }

export const TOPIC_ICONS = ['wind', 'heart-crack', 'flower', 'shield', 'heart', 'sun', 'sunrise', 'sparkles', 'bird', 'mountain'] as const
export type TopicIcon = (typeof TOPIC_ICONS)[number]

export interface Topic {
  id: string
  icon: TopicIcon
  title: Localized
  intro: Localized
  refs: string[]
}

export const TOPICS: readonly Topic[] = raw as Topic[]

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id)
}
