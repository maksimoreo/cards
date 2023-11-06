describe.skip('root', () => {
  beforeAll(() => console.log('beforeAll root'))
  beforeEach(() => console.log('beforeEach root'))

  test('1', () => console.log('1'))

  describe('nested', () => {
    beforeAll(() => console.log('beforeAll nested'))
    beforeEach(() => console.log('beforeEach nested'))

    test('2', () => console.log('2'))
    test('3', () => console.log('3'))
  })
})
