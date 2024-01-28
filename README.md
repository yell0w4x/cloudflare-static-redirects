# Worker for Cloudflare Workers Sites that supports simple redirects

Simple support for [pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/).
No wildcard or placeholders or any other stuff supported.

Just put `_redirects` file into the root of a folder containg static files to be deployed and 
put a reference to `index.ts` in you `wrangler.toml` as `main = "index.ts"`.

The content of `_redirects` is as follows.
```
/original/path1 /new/path2 301
/original/path2 /new/path2 301
...
```
