import type { bearblogApiPostRequest, BearblogPostList, BearblogPostStatuses, BearblogPost } from "./post.d.ts";

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

export async function postToApi(endpoint: string, content: object) {
    const subdomain = process.env.BEARBLOG_SUBDOMAIN;
    const token = process.env.BEARBLOG_KEY;

    const response = await fetch(
        `https://bearblog.dev/${subdomain}/api/v1/${endpoint}`,
        {
            method: "POST",
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

export async function createDraft(post: bearblogApiPostRequest) {
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