import { SectionRadarChart } from '../charts/SectionRadarChart'

type SectionScore = {
  id: string
  label: string
  average: number
  percent: number
}

type SectionScoreListProps = {
  sections: SectionScore[]
  max?: number
}

export function SectionScoreList({ sections, max = 4 }: SectionScoreListProps) {
  return <SectionRadarChart sections={sections} max={max} />
}
