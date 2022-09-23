import Joi from 'joi'

export const proposalIdSchema = Joi.string().alphanum().length(10).required()
