const {expect, test} = require('@oclif/test')

describe('validate', () => {
  test
  .stdout()
  .command(['validate'])
  .it('runs validate', ctx => {
    expect(ctx.stdout).to.contain('validate world')
  })

  test
  .stdout()
  .command(['validate', '--name', 'jeff'])
  .it('runs validate --name jeff', ctx => {
    expect(ctx.stdout).to.contain('validate jeff')
  })
})
