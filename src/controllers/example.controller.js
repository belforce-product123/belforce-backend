/**
 * Example controller - demonstrates controller structure
 */

export const getExample = (req, res) => {
  res.json({
    message: 'Hello from Belforce API',
    data: { timestamp: new Date().toISOString() },
  });
};

export const createExample = (req, res) => {
  const { body } = req;
  res.status(201).json({
    message: 'Resource created',
    data: body,
  });
};
