export type BearblogPost = {
    title: string,
    content: string,
    slug: string,
    publish: boolean,
    published_date: null | string,
    tags: string[],
    is_page: boolean,
    discoverable: boolean,
    alias: string,
    canonical_url: string,
    meta_description: string,
    meta_image: string,
    lang: string,
    class_name: string,
    uid: string,
    url: string,
    last_modified: string,
    token: string
}

export type BearblogApiPostResponse = Required<BearblogPost>
export type BearblogApiPostRequest = Pick<BearblogPost, "title" | "content">
    & Partial<Omit<BearblogPost, "title" | "content">>;


export type BearblogPostList = {
    posts: BearblogPost[]
}

export enum BearblogPostStatuses {
    Draft = "draft",
    Published = "published"
}