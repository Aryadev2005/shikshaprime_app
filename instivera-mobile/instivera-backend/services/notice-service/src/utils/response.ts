export const sendSuccess = (res: any, data: any, message: string = 'Success') => {
  res.status(200).json({ status: 1, data, message });
};

export const sendError = (res: any, code: number, message: string) => {
  res.status(code).json({ status: 0, data: null, message });
};
