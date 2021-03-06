import { connect, disconnect } from '../../../core'
import { NewUserDatabaseDto } from '../../../../../dtos'

import { testingUsers, cleanUsersCollection, getUserByUsername } from '../../../../../../test/fixtures'

import { create } from '../../user.mongodb.requests'

const { username, password, email } = testingUsers[0]

describe('[ORM] MongoDB - create', () => {
  const mockedUserData: NewUserDatabaseDto = {
    username,
    password,
    email
  }

  beforeAll(async () => {
    await connect()
  })

  beforeEach(async () => {
    await cleanUsersCollection()
  })

  afterAll(async () => {
    await cleanUsersCollection()
    await disconnect()
  })

  it('must persist the new user successfully', async (done) => {
    const newUserData = { ...mockedUserData }
    await create(newUserData)

    const retrievedUser = await getUserByUsername(username)

    const expectedFields = ['_id', 'username', 'password', 'email', 'name', 'surname', 'avatar', 'token', 'enabled', 'deleted', 'lastLoginAt', 'createdAt', 'updatedAt']
    const retrievedUserFields = Object.keys(retrievedUser).sort()
    expect(retrievedUserFields.sort()).toEqual(expectedFields.sort())

    expect(retrievedUser._id).not.toBeNull()
    expect(retrievedUser.username).toBe(mockedUserData.username)
    expect(retrievedUser.password).toBe(mockedUserData.password)
    expect(retrievedUser.email).toBe(mockedUserData.email)
    expect(retrievedUser.enabled).toBeTruthy()
    expect(retrievedUser.deleted).toBeFalsy()
    expect(retrievedUser.createdAt).not.toBeNull()
    expect(retrievedUser.updatedAt).not.toBeNull()

    expect(retrievedUser.name).toBe('')
    expect(retrievedUser.surname).toBe('')
    expect(retrievedUser.avatar).toBe('')
    expect(retrievedUser.token).toBe('')
    expect(retrievedUser.lastLoginAt).toBe('')

    done()
  })

  it('must throw an error when we try to persist the same username', async (done) => {
    const newUserData = { ...mockedUserData }
    await create(newUserData)

    // MongoError: E11000 duplicate key error collection: ts-course-test.users index: username_1 dup key: { username: "test@mail.com" }
    await expect(create(newUserData)).rejects.toThrow(/duplicate key error/)

    done()
  })
})
