export type Problem = {
  problemID: string
  title: string
  text: string
  problem: string
  input: string
  output: string
  sampleData: {
    input: string
    output: string
  }[]
  tags: string[]
  resources: {
    name: string
    url: string
  }[]
}
