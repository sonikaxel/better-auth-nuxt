export default defineEventHandler(async (event) => {
  await requireUserSession(event, {
    rule(userSession) {
      return userSession.user.role?.split(',').includes('user') ?? false;
    }
  });

  return {
    success: true
  };
});
