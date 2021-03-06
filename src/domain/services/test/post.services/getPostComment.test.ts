import { mongodb } from '../../../../infrastructure/orm'
import { postDataSource } from '../../../../infrastructure/dataSources'
import { PostCommentDomainModel, PostDomainModel } from '../../../models'
import { testingLikedAndCommentedPersistedDtoPosts, testingLikedAndCommentedPersistedDomainModelPosts, savePosts, cleanPostsCollection } from '../../../../test/fixtures'

import { getPostComment } from '../..'
import { GettingPostCommentError } from '../../../errors/PostErrors'
import { PostDto } from '../../../../infrastructure/dtos'

describe('[SERVICES] Post - getPostComment', () => {
  const { connect, disconnect } = mongodb

  const mockedPosts = testingLikedAndCommentedPersistedDtoPosts as PostDto[]
  const selectedPost = testingLikedAndCommentedPersistedDomainModelPosts[0] as PostDomainModel
  const selectedComment = selectedPost.comments[0]
  const mockedNonValidPostId = mockedPosts[1]._id as string
  const mockedNonValidCommentId = mockedPosts[1].comments[0]._id as string

  beforeAll(async () => {
    await connect()
    await savePosts(mockedPosts)
  })

  afterAll(async () => {
    await cleanPostsCollection()
    await disconnect()
  })

  it('must retrieve the selected post comment', async (done) => {
    const postId = selectedPost.id as string
    const commentId = selectedComment.id as string

    const persistedComment = await getPostComment(postId, commentId) as PostCommentDomainModel

    const expectedFields = ['id', 'body', 'owner', 'createdAt', 'updatedAt']
    const persistedCommentFields = Object.keys(persistedComment).sort()
    expect(persistedCommentFields.sort()).toEqual(expectedFields.sort())

    expect(persistedComment).toStrictEqual<PostCommentDomainModel>(selectedComment)

    done()
  })

  it('must return NULL when select a post which doesn\'t contain the provided comment', async (done) => {
    const postId = mockedNonValidPostId
    const commentId = selectedComment.id as string

    await expect(getPostComment(postId, commentId)).resolves.toBeNull()

    done()
  })

  it('must return NULL when provide a comment which is not contained into the selected post', async (done) => {
    const postId = selectedPost.id as string
    const commentId = mockedNonValidCommentId

    await expect(getPostComment(postId, commentId)).resolves.toBeNull()

    done()
  })

  it('must throw an INTERNAL_SERVER_ERROR (500) when the datasource throws an unexpected error', async (done) => {
    jest.spyOn(postDataSource, 'getPostComment').mockImplementation(() => {
      throw new Error('Testing error')
    })

    const postId = selectedPost.id as string
    const commentId = selectedComment.id as string

    try {
      await getPostComment(postId, commentId)
    } catch (error) {
      expect(error).toStrictEqual(new GettingPostCommentError(`Error retereaving post comment. ${error.message}`))
    }

    jest.spyOn(postDataSource, 'getPostComment').mockRestore()

    done()
  })
})
