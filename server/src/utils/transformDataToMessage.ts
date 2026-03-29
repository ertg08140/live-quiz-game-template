export const transformDataToMessage = (data: Buffer) => {
  return JSON.parse(data.toString());
};
