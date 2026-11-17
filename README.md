# Better Auth Nuxt Module _(for personal use case)_

This project is a forked version [nuxt-modules/better-auth](http://github.com/nuxt-modules/better-auth) with less functionality and more control to better-auth.

## Why this was made?

- The [nuxt-modules/better-auth](http://github.com/nuxt-modules/better-auth) already is a solid module with all native nuxt related stuff. But the module does not support dynamic `baseURL` feature of Better Auth which for my use case is required.
- It may be added in future but for now as per my need I just made this project so that I can add to my own project.

## Who this is for

- Anyone can use it who need basic authentication of Better Auth and want more control over Better Auth configuration in your Nuxt app and don't want to use [nuxt-modules/better-auth](http://github.com/nuxt-modules/better-auth).
- For more in-built feature such as NuxtHub it recommanded to use [nuxt-modules/better-auth](http://github.com/nuxt-modules/better-auth).

## Requirement

- Nuxt 4.0 or newer
- Node.js `^22.19.0`, `^24.11.0`, or `>=26.0.0`
- A Better Auth `^1.7.0`.

## Installation

There no offical module registered in nuxt-module library, so to use this project you will require to setup manually.

- Download `zip` file, extract it, copy all content from `src/` directory to `modules/better-auth/` directory of your project.
- Or, use `git clone --depth 1` to clone latest history and delete `.git` _(important)_.

## Step after installation

1. Copy all the content from `src/` directory to `modules/better-auth/` directory of your project.
2. Open `module.ts` file from `modules/better-auth/`
   and rename all import statements ending with `@nuxt/kit` to `nuxt/kit`.
3. Rename `module.ts` file to `index.ts`.
4. Thats it! nuxt will automatically register this module to your nuxt app if above steps are done correctly.

If all goes well, your app will run without error.

## Notes

* Unlike [nuxt-modules/better-auth](http://github.com/nuxt-modules/better-auth), `baseURL` of better-auth server needs to be set manually _(ofcourse, this is the main reason behind this project)_.
* Order of finding `secret` is `BETTER_AUTH_SECRET -> AUTH_SECRET -> NUXT_APP_SECRET`. `NUXT_APP_SECRET` is new auto generated runtime config introduced in Nuxt. So during development this secret will be use if default secret is not set. But in production it is adviced to set this secret in env using `NUXT_APP_SECRET` to keep session stable or explicity use `BETTER_AUTH_SECRET` or `AUTH_SECRET`.