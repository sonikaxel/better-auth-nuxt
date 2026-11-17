<script lang="ts" setup>
const { user, session } = useUserSession();
</script>

<template>
  <div>
    <h2>Admin Page (CSR)</h2>

    <div>
      <pre>User: {{ user }}</pre>
      <pre>Session: {{ session }}</pre>
    </div>
  </div>
</template>
