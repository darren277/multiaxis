type Resource = {
    name: string
    author: string
    year: number
    dewey: string
    word_count: number
    personal_rating: number
    description: string
}

type Library = {
    bookcase: {
        width: number
        height: number
        depth: number
    }
    numberOfRows: number
    numberOfCases: number
    spaceBetweenRows: number
    spaceBetweenCases: number
    numberOfFloors: number
}

export type { Resource, Library }
