<script lang="ts" setup>
const client = useAuthClient();

const login = async () => {
  const result = await client.signIn.email({
    email: 'user@example.com',
    password: 'password'
  });

  if (result.error) {
    alert(`Login fail: ${result.error.message}`);
    return;
  }

  navigateTo('/');
};
</script>

<template>
  <div>
    <h3>Login</h3>

    <div>
      <button @click="login">
        Login
      </button>
    </div>
  </div>
</template>
