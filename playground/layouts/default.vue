<script lang="ts" setup>
const links = [
  {
    label: 'Home (SSR)',
    to: '/'
  },
  {
    label: 'Login',
    to: '/login'
  },
  {
    label: 'Register',
    to: '/register'
  },
  {
    label: 'Admin (CSR)',
    to: '/admin'
  }
];
</script>

<template>
  <div id="def_layout">
    <div style="display: flex; align-items: center; gap: 0.5rem">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
      >
        {{ link.label }}
      </NuxtLink>
    </div>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>
