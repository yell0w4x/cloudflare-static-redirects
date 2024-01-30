import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);


async function getRedirects(staticContent) {
    const realKey = assetManifest['_redirects'];
    const redirectStr = realKey && await staticContent.get(realKey);

    if (!redirectStr) {
        return {};
    }

    let result = {};

    for (let s of redirectStr.split('\n')) {
        let values = s.split(/\s+/);
        if (values.length < 3) {
            continue;
        }
        result[values[0]] = { 'to': values[1], 'method': parseInt(values[2]) };
    }

    return result;
}


function makeNotFoundResponse(pathname) {
    return new Response(`${pathname} not found`, {
        status: 404,
        statusText: 'Not Found'
    });
}


export default {
    async fetch(request, env, ctx) {
        try {
                try {
                    const redirects = await getRedirects(env.__STATIC_CONTENT);
                    const pathname = new URL(request.url).pathname;
                    if (pathname in redirects) {
                        let newUrl = new URL(redirects[pathname]['to'], new URL(request.url).origin);
                        return Response.redirect(newUrl, redirects[pathname]['method']);
                    }
                } catch (e) {
                    console.log(`Redirect failed [${e.stack}]`)
                }

            return await getAssetFromKV({
                    request,
                    waitUntil: ctx.waitUntil.bind(ctx),
                }, {
                    ASSET_NAMESPACE: env.__STATIC_CONTENT,
                    ASSET_MANIFEST: assetManifest,
                });
        } catch (e) {
            try {
                const realKey = assetManifest['404.html'];
                const value = realKey && await env.__STATIC_CONTENT.get(realKey);
                if (value == null) {
                    const pathname = new URL(request.url).pathname;
                    return makeNotFoundResponse(pathname);
                }
                return new Response(value, {
                    status: 404,
                    statusText: 'Not Found',
                    headers: {'content-type': 'text/html'}
                });
            } catch (e) {
                return new Response(`$${e.stack}`, {
                    status: 500,
                    statusText: 'Internal Server Error',
                });
            }
        }
    }
};
