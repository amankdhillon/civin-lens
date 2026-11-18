// Shared state. The signed-in profile and its chosen body ids.
export const state = {
  me: null,         // { id, nickname, bodyIds } or null before joining
  bootError: null,  // set if the connection failed at startup
};
