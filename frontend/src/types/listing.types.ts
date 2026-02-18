import type { User } from "../types/user.type"
export type ListingInput =  {
    title: string,
    description: string,
    price: number,
    categories: string[],
    images: string[]
}

export type ListingData = {
    title: string,
    description: string,
    price: number,
    _id: string,
    createdAt: string,
    updatedAt: string
    categories: string[],
    images: string[],
    user: User,
    isSold: boolean
}