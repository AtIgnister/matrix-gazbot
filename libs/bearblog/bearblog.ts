import type { BearblogApiPostRequest, BearblogPostList, BearblogPostStatuses, BearblogPost } from "./post.d.ts";
import fm from "front-matter";

export async function queryApi(endpoint: string) {
    const subdomain = process.env.BEARBLOG_SUBDOMAIN;
    const token = process.env.BEARBLOG_KEY;

    const response = await fetch(
        `https://bearblog.dev/${subdomain}/api/v1/${endpoint}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Bear Blog API error: ${response.status} ${JSON.stringify(data)}`);
    }

    return data;
}

export async function postToApi(endpoint: string, content: object, method: string = "POST") {
    const subdomain = process.env.BEARBLOG_SUBDOMAIN;
    const token = process.env.BEARBLOG_KEY;

    const response = await fetch(
        `https://bearblog.dev/${subdomain}/api/v1/${endpoint}`,
        {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(content),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Bear Blog API error: ${response.status} ${JSON.stringify(data)}`);
    }

    return data;
}

export async function createDraft(post: BearblogApiPostRequest) {
    const tags = post.tags ?? []
    const data = await postToApi("post/", {
        title: post.title,
        content: post.content,
        tags: tags,
    })

    try {
        const post = data as BearblogPost;
        return post;
    } catch {
        return null;
    }
}

export async function updatePost(uuid: string, post: BearblogApiPostRequest) {
    // removes all non-truthy data. A bit jank, i suppose? But it should 100% prevent us from un-setting fields that aren't specified in the frontmatter for the updated post.
    const payload = Object.fromEntries(
        Object.entries(post).filter(([_, value]) => Boolean(value))
    );

    const data = await postToApi(`post/${uuid}/`, payload, "PATCH");

    try {
        const post = data as BearblogPost;
        return post;
    } catch {
        return null;
    }
}

export async function publishPost(uuid: string): Promise<BearblogPost | null> {
    try {
        const data = await postToApi(
            `post/${uuid}/`,
            { publish: true, discoverable: true },
            "PATCH"
        );

        return data as BearblogPost;
    } catch (error) {
        console.error("Failed to publish post:", error);
        return null;
    }
}

export async function getPostList(status: BearblogPostStatuses): Promise<BearblogPostList> {
    return await queryApi(`post/?status=${status}`) as BearblogPostList;
}

export async function getPost(uuid: string): Promise<BearblogPost | null> {
    try {
        return await queryApi(`post/${uuid}/`) as BearblogPost;
    } catch {
        return null;
    }
}

export function parseBearblogPost(text: string, fallbackTitle: string): BearblogApiPostRequest {
    const parsed = fm<Record<string, unknown>>(text);
    const attributes = parsed.attributes;

    const post: BearblogApiPostRequest = {
        title: typeof attributes.title === "string"
            ? attributes.title
            : fallbackTitle,

        content: parsed.body,

        // tags
        ...(Array.isArray(attributes.tags) &&
            attributes.tags.every(tag => typeof tag === "string")
            ? { tags: attributes.tags }
            : {}),

        // date
        ...(typeof attributes.date === "string"
            ? { date: attributes.date }
            : {}),

        // publish
        ...(typeof attributes.publish === "boolean"
            ? { publish: attributes.publish }
            : {}),

        // meta_description
        ...(typeof attributes.meta_description === "string"
            ? { meta_description: attributes.meta_description }
            : {}),

        // meta_image
        ...(typeof attributes.meta_image === "string"
            ? { meta_image: attributes.meta_image }
            : {}),

        // slug
        ...(typeof attributes.slug === "string"
            ? { slug: attributes.slug }
            : {}),

        // slug alias
        ...(typeof attributes.link === "string"
            ? { link: attributes.slug }
            : {}),

            
    };

    return post;
}