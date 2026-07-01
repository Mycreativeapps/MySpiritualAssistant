export const getInitials = (name: string) => {
  if (!name) return '';
  return name.trim().substring(0, 1).toUpperCase();
};
