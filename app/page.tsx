"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, CheckCircle2 } from "lucide-react"

interface DuplicateRange {
  start: number
  end: number
  groupIndex: number
}

export default function AdsenseAnalyzerPage() {
  const [text, setText] = useState("")
  const [charCountWithSpaces, setCharCountWithSpaces] = useState(0)
  const [charCountWithoutSpaces, setCharCountWithoutSpaces] = useState(0)
  const [byteCountWithSpaces, setByteCountWithSpaces] = useState(0)
  const [byteCountWithoutSpaces, setByteCountWithoutSpaces] = useState(0)
  const [duplicates, setDuplicates] = useState<DuplicateRange[]>([])
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false, false])

  useEffect(() => {
    const withSpaces = text.length
    const withoutSpaces = text.replace(/\s/g, "").length
    const encoder = new TextEncoder()
    const bytesWithSpaces = encoder.encode(text).length
    const bytesWithoutSpaces = encoder.encode(text.replace(/\s/g, "")).length

    setCharCountWithSpaces(withSpaces)
    setCharCountWithoutSpaces(withoutSpaces)
    setByteCountWithSpaces(bytesWithSpaces)
    setByteCountWithoutSpaces(bytesWithoutSpaces)
  }, [text])

  const analyzeText = () => {
    console.log("[v0] Starting analysis...")
    if (!text.trim()) {
      setDuplicates([])
      setIsAnalyzed(false)
      return
    }

    const sentences: { text: string; start: number; end: number }[] = []
    const lines = text.split("\n")
    let currentPosition = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 3) {
        const sentenceRegex = /[^.!?。！？]+[.!?。！？]?/g
        let match

        while ((match = sentenceRegex.exec(line)) !== null) {
          const sentenceText = match[0].trim()
          if (sentenceText.length > 3) {
            const startInOriginal = text.indexOf(sentenceText, currentPosition)
            if (startInOriginal !== -1) {
              sentences.push({
                text: sentenceText,
                start: startInOriginal,
                end: startInOriginal + sentenceText.length,
              })
            }
          }
        }
      }
      currentPosition += line.length + 1
    }

    console.log("[v0] Found sentences:", sentences.length)

    const duplicateRanges: DuplicateRange[] = []
    const processedIndices = new Set<number>()
    let groupIndex = 0

    for (let i = 0; i < sentences.length; i++) {
      if (processedIndices.has(i)) continue

      const sentence1 = sentences[i].text.trim()
      const duplicateGroup: number[] = [i]

      for (let j = i + 1; j < sentences.length; j++) {
        if (processedIndices.has(j)) continue

        const sentence2 = sentences[j].text.trim()
        const similarity = calculateSimilarity(sentence1, sentence2)

        console.log(`[v0] Comparing:\n  "${sentence1}"\n  "${sentence2}"\n  Similarity: ${similarity}`)

        if (similarity >= 0.6) {
          duplicateGroup.push(j)
          processedIndices.add(j)
        }
      }

      if (duplicateGroup.length > 1) {
        processedIndices.add(i)
        console.log(`[v0] Found duplicate group ${groupIndex} with ${duplicateGroup.length} instances`)

        duplicateGroup.forEach((index) => {
          duplicateRanges.push({
            start: sentences[index].start,
            end: sentences[index].end,
            groupIndex,
          })
        })
        groupIndex++
      }
    }

    console.log("[v0] Total duplicate ranges:", duplicateRanges.length)
    setDuplicates(duplicateRanges)
    setIsAnalyzed(true)
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()
    const s1 = normalize(str1)
    const s2 = normalize(str2)

    if (s1 === s2) {
      console.log("[v0] Exact match found!")
      return 1.0
    }

    const lengthDiff = Math.abs(s1.length - s2.length) / Math.max(s1.length, s2.length)
    if (lengthDiff > 0.5) return 0

    const words1 = s1.split(/\s+/).filter((w) => w.length > 0)
    const words2 = s2.split(/\s+/).filter((w) => w.length > 0)

    if (words1.length === 0 || words2.length === 0) return 0

    const set1 = new Set(words1)
    const set2 = new Set(words2)

    const intersection = new Set([...set1].filter((x) => set2.has(x)))
    const union = new Set([...set1, ...set2])

    const wordSimilarity = intersection.size / union.size

    const maxLen = Math.max(s1.length, s2.length)
    if (maxLen === 0) return 1.0

    let matches = 0
    const minLen = Math.min(s1.length, s2.length)

    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) matches++
    }

    const charSimilarity = matches / maxLen
    return wordSimilarity * 0.7 + charSimilarity * 0.3
  }

  const renderHighlightedText = () => {
    if (duplicates.length === 0 || !text) {
      return null
    }

    const colors = [
      "rgba(254, 240, 138, 0.6)",
      "rgba(187, 247, 208, 0.6)",
      "rgba(191, 219, 254, 0.6)",
      "rgba(233, 213, 255, 0.6)",
      "rgba(251, 207, 232, 0.6)",
      "rgba(254, 215, 170, 0.6)",
    ]

    const sortedDuplicates = [...duplicates].sort((a, b) => a.start - b.start)
    const elements: React.ReactNode[] = []
    let lastIndex = 0

    sortedDuplicates.forEach((dup, index) => {
      if (dup.start > lastIndex) {
        elements.push(<span key={`text-${index}`}>{text.substring(lastIndex, dup.start)}</span>)
      }

      const color = colors[dup.groupIndex % colors.length]
      elements.push(
        <mark key={`mark-${index}`} style={{ backgroundColor: color, color: "inherit" }} className="rounded px-0.5">
          {text.substring(dup.start, dup.end)}
        </mark>,
      )

      lastIndex = dup.end
    })

    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.substring(lastIndex)}</span>)
    }

    return <div className="whitespace-pre-wrap break-words leading-relaxed">{elements}</div>
  }

  const copyAll = () => {
    navigator.clipboard.writeText(text)
  }

  const clearAll = () => {
    setText("")
    setDuplicates([])
    setIsAnalyzed(false)
  }

  const toggleChecklistItem = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index] = !newChecklist[index]
    setChecklist(newChecklist)
  }

  const checklistScore = checklist.filter((item) => item).length * 20

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const checklistItems = [
    {
      question: "애드센스 승인용 사이트에 카테고리가 없거나 1개 이하로 있나요?",
      description: "카테고리가 많을 수록 애드센스 승인용 콘텐츠를 많이 작성해야 합니다.",
    },
    {
      question: "애드센스 승인용 콘텐츠가 하나의 카테고리에 50개 이상 작성되어 있나요?",
      description: "카테고리 1개에 50개 이상 승인용 콘텐츠가 작성되어 있어야 애드센스 승인에 유리합니다.",
    },
    {
      question: "애드센스 승인용 콘텐츠는 전문적인 주제로 작성되어 있나요?",
      description:
        "애드센스 승인에 유리한 주제는 건강질병∙기술과학∙금융경제∙역사인물∙종교철학∙지구생물∙천문학∙심리학 등입니다.",
    },
    {
      question: "애드센스 승인용 콘텐츠 전부 2500자 이상 전문성있게 작성되어 있나요?",
      description: "승인용 글이 2500자 이하거나 전문성이 없으면 애드센스 승인에 불리합니다.",
    },
    {
      question: "승인용 콘텐츠 본문에 불필요한 링크가 없나요?",
      description: "링크가 있으면 애드센스 승인에 불리합니다.",
    },
  ]

  const knowhowItems = [
  {
    title: "애드센스 승인 1원칙 : 애드센스 광고는 빈 페이지에 노출되면 안된다.",
    content: `애드센스는 빈페이지에 광고를 노출할 수 없습니다.
여기서 말하는 빈페이지란 카테고리, 메뉴, 비어있는 링크 등을 포함합니다.
애드센스 승인을 위해 준비해 둔 블로그 또는 사이트에 비어있는 카테고리, 페이지가 있는 경우 아무리 콘텐츠가 많아도 애드센스 승인에 탈락하게 됩니다.
애드센스 승인 전 반드시 사이트 또는 블로그에 빈페이지가 있는지 확인하시길 바랍니다.`,
  },
  {
    title: "애드센스 승인 2원칙 : 애드센스 광고를 삽입하려는 페이지에 충분한 콘텐츠가 있어야 한다.",
    content: `빈페이지가 없더라도 페이지 당 충분한 콘텐츠가 없으면 애드센스 승인은 거절됩니다.
페이지 = 카테고리라고 생각했을 때 카테고리마다 충분한 콘텐츠가 있어야 한다는 뜻입니다.
카테고리가 많으면 많을수록 연결되는 링크가 많으면 많을수록 승인 난이도가 상승합니다.
애드센스 승인을 받을 때는 카테고리를 1개만 만들어서 승인글을 작성해야 하는 이유입니다.`,
  },
  {
    title: "애드센스 승인 3원칙 : 애드센스 고품질 콘텐츠 가이드라인",
    content: `간단히 말해 전문적인 주제로 글을 길게 쓰라는 것입니다.
전문적이지 않은 주제, 의미없는 단어 및 문장을 나열한 글은 애드센스 고품질 콘텐츠 가이드라인을 지키지 못한 것입니다.
전문적인 주제로 글을 20~30개 가량 작성하면 애드센스 승인을 쉽게 받을 수 있습니다.
다만 최근에는 승인 기준이 상승해 최소 글 30개 이상 작성해야 하는 경우도 있습니다.`,
  },
  {
    title: "애드센스 승인 4원칙 : 저작권 규정 위반",
    content: `온라인상의 글을 복붙하는 경우 애드센스 승인이 절대 나지 않습니다.
200개, 300개 글이 있어도 복사한 콘텐츠는 절대 승인이 나지 않게 됩니다.
온라인 상에 올라온 글이 아닌 내가 메모장에 직접 적은 글을 복사해 넣는 것은 문제가 되지 않습니다.
또한 ChatGPT에서 새롭게 생성한 글 역시 복붙해도 문제가 되지 않습니다.
최근 애드센스 승인은 100% ChatGPT로 작업을 하는 것이 일반화되었습니다.`,
  },
  {
    title: "애드센스 승인 5원칙 : 애드센스 승인을 쉽게 받을 수 있는 주제",
    content: `애드센스 승인 심사에서는 단순히 글의 양보다 주제의 전문성과 사회적 가치가 중요하게 평가됩니다.
특히 독창적인 정보나 분석이 포함된 주제는 승인 확률이 높습니다. 애드센스 승인에 유리한 주제는 금융경제, 건강질병, 우주산업, 식품효능, 역사인물, 세계유산, 문학작품, 기술산업, 과학생물 등이 있습니다.
`,
  },
];

  return (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-foreground cursor-pointer"
          onClick={() => window.location.reload()}
        >
          애드센스 승인도우미
        </h1>
        <nav className="flex gap-6">
            <button
              onClick={() => scrollToSection("analyzer")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              애드센스 승인콘텐츠 분석기
            </button>
            <button
              onClick={() => scrollToSection("checklist")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              애드고시 체크리스트
            </button>
            <button
              onClick={() => scrollToSection("knowhow")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              애드센스 승인 5원칙
            </button>
          </nav>
        </div>
      </header>

      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          <section id="analyzer" className="scroll-mt-20">

  {/* ✅ 광고 영역 시작 — 애드센스 승인콘텐츠 분석기 상단광고 */}
  <div style={{ textAlign: "center", margin: "15px 0" }}>
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-9591765421576424"
      data-ad-slot="4754611186"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
    <script
      dangerouslySetInnerHTML={{
        __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
      }}
    />
  </div>
  {/* ✅ 광고 영역 끝 */}

  <h2 className="text-3xl font-bold text-center text-foreground mb-6">
    애드센스 승인 콘텐츠 분석기
  </h2>

            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap gap-8 justify-center text-center divide-x divide-border">
                <div className="px-6 first:pl-0">
                  <p className="text-sm text-muted-foreground mb-1">공백포함</p>
                  <p className="text-lg font-semibold">
                    총 <span className="text-orange-600 dark:text-orange-400">{charCountWithSpaces}</span>자 (
                    {byteCountWithSpaces}byte)
                  </p>
                </div>
                <div className="px-6">
                  <p className="text-sm text-muted-foreground mb-1">공백제외</p>
                  <p className="text-lg font-semibold">
                    총 <span className="text-orange-600 dark:text-orange-400">{charCountWithoutSpaces}</span>자 (
                    {byteCountWithoutSpaces}byte)
                  </p>
                </div>
                <div className="px-6">
                  <p className="text-sm text-muted-foreground mb-1">중복 문장</p>
                  <p className="text-lg font-semibold">
                    <span className="text-orange-600 dark:text-orange-400">{duplicates.length}</span>개
                  </p>
                </div>
              </div>

              {duplicates.length === 0 ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[300px] w-full rounded-md border border-input bg-card p-4 text-base text-foreground focus:ring-2 focus:ring-ring resize-none leading-relaxed"
                  placeholder="여기에 콘텐츠를 입력하세요..."
                />
              ) : (
                <div className="min-h-[300px] w-full rounded-md border border-input bg-card p-4 text-base text-foreground overflow-auto max-h-[500px]">
                  {renderHighlightedText()}
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={analyzeText} size="lg" className="min-w-[120px] bg-gray-600 hover:bg-gray-700">
                  승인글 분석
                </Button>
                <Button
                  onClick={copyAll}
                  variant="outline"
                  size="lg"
                  className="min-w-[120px] bg-transparent hover:bg-orange-600 hover:text-white hover:border-orange-600"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  전체복사
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="lg"
                  className="min-w-[120px] bg-transparent hover:bg-orange-600 hover:text-white hover:border-orange-600"
                >
                  전체지우기
                </Button>
              </div>

              {isAnalyzed && (
                <div className="pt-4 border-t space-y-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-foreground mb-4">글자수 분석</h3>
                    {charCountWithoutSpaces >= 2500 ? (
                      <div className="text-center">
                        <div className="inline-block border-2 border-green-600 dark:border-green-400 rounded-full px-4 py-1 mb-3">
                          <p className="text-base font-bold text-green-600 dark:text-green-400">통과</p>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          현재 글자수는 {charCountWithoutSpaces}자로 애드센스 승인 기준인 2500자 이상을 충족합니다.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="inline-block border-2 border-red-600 dark:border-red-400 rounded-full px-4 py-1 mb-3">
                          <p className="text-base font-bold text-red-600 dark:text-red-400">수정필요</p>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          현재 글자수는 {charCountWithoutSpaces}자로 애드센스 승인 기준인 2500자에 미달됩니다. 글자수를
                          더 채우세요.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border" />

                  <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-foreground mb-4">중복문장 분석</h3>
                    {duplicates.length === 0 ? (
                      <div className="text-center">
                        <div className="inline-block border-2 border-green-600 dark:border-green-400 rounded-full px-4 py-1 mb-3">
                          <p className="text-base font-bold text-green-600 dark:text-green-400">통과</p>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          중복문장이 없어 애드센스 승인기준을 충족합니다.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="inline-block border-2 border-red-600 dark:border-red-400 rounded-full px-4 py-1 mb-3">
                          <p className="text-base font-bold text-red-600 dark:text-red-400">수정필요</p>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          중복문장이 {duplicates.length}개 있습니다. 중복문장을 수정하세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">분석 기준:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>글자수: 2,500자 이상 (공백 제외)</li>
                  <li>중복 문장: 5개 미만</li>
                  <li>문장 유사도: 60% 이상일 때 중복으로 인식</li>
                </ul>
                <p className="mt-3 text-xs">중복 문장은 다양한 색상으로 하이라이트됩니다.</p>
              </div>
            </Card>
          </section>

          <section id="checklist" className="scroll-mt-20">
            {/* ✅ 광고 영역 시작 — 인아티클형 애드센스 광고 */}
<div style={{ textAlign: "center", margin: "15px 0" }}>
  <ins
    className="adsbygoogle"
    style={{ display: "block", textAlign: "center" }}
    data-ad-layout="in-article"
    data-ad-format="fluid"
    data-ad-client="ca-pub-9591765421576424"
    data-ad-slot="7020847727"
  ></ins>
  <script
    dangerouslySetInnerHTML={{
      __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
    }}
  />
</div>
{/* ✅ 광고 영역 끝 */}

            <h2 className="text-3xl font-bold text-center text-foreground mb-6">애드고시 체크리스트</h2>

            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                {checklistItems.map((item, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-h-[48px] flex flex-col justify-center">
                        <p className="font-semibold text-foreground mb-1">{item.question}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <button
                        onClick={() => toggleChecklistItem(index)}
                        className="flex-shrink-0 w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-orange-500 transition-colors"
                      >
                        {checklist[index] && <CheckCircle2 className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-2">현재 점수</p>
                  <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{checklistScore}점</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">참고사항:</span> 위의 애드고시 체크리스트는 애드센스
                    승인 필수 요건을 체크한 것이며, 작성된 콘텐츠의 전문성 여부에 따라 승인 거절이 나올 수 있으니
                    참고용으로만 활용하시길 바랍니다.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section id="knowhow" className="scroll-mt-20 mb-16">
            {/* ✅ 광고 영역 시작 — 인아티클형 애드센스 광고 */}
<div style={{ textAlign: "center", margin: "15px 0" }}>
  <ins
    className="adsbygoogle"
    style={{ display: "block", textAlign: "center" }}
    data-ad-layout="in-article"
    data-ad-format="fluid"
    data-ad-client="ca-pub-9591765421576424"
    data-ad-slot="7020847727"
  ></ins>
  <script
    dangerouslySetInnerHTML={{
      __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
    }}
  />
</div>
{/* ✅ 광고 영역 끝 */}

            <h2 className="text-3xl font-bold text-center text-foreground mb-6">애드센스 승인 5원칙</h2>

            <div className="border rounded-lg overflow-hidden">
              {knowhowItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-6 border-b last:border-b-0 ${index % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                >
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
