export function buildPublicEventUrl(username, slug) {
    if(!username || !slug) return "";
    const origin = window.location.origin;
    return `${origin}/#/u/${username}/event/${slug}`;
}