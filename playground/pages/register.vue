<script lang="ts" setup>
const client = useAuthClient();

const register = async () => {
  const result = await client.signUp.email({
    email: 'user@example.com',
    password: 'password',
    name: 'John Doe'
  });

  if (result.error) {
    alert(`Signup fail: ${result.error.message}`);
    return;
  }

  navigateTo('/');
};
</script>

<template>
  <div>
    <h3>Register</h3>

    <div>
      <button @click="register">
        Signup
      </button>
    </div>
  </div>
</template>
