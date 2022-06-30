import { DataTypes, Sequelize } from 'sequelize'

const SCHEMA_RMRK_2 = 'rmrk_2'
const DB_CONNECTION = process.env.DB_CONNECTION || ''

const DEV_MODE = process.env.NODE_ENV === 'development'
console.log('DEV_MODE', DEV_MODE)

const sequelize = new Sequelize(DB_CONNECTION, {
  schema: SCHEMA_RMRK_2,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
})

const Nft = sequelize.define(
  'Nft',
  {
    block: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    collection: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transferable: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rootowner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    properties: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    forSale: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    reactions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    priority: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    children: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    resources: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    burned: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  { tableName: 'nft' }
)

const main = async () => {
  try {
    // Check connection
    await sequelize.authenticate()
    console.log('Connection has been established successfully.')

    // Create schemas
    sequelize.createSchema(SCHEMA_RMRK_2, { logging: console.log })

    // Sync schema if in dev mode
    if (DEV_MODE) {
      await sequelize.sync({ alter: true })
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}

main()
  .catch(console.error)
  .finally(() => {
    sequelize.close()
  })
