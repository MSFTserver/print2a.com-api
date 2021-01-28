import app from '../src/server.js'
import chai from 'chai'
import chaiHttp from 'chai-http'
import assert from 'assert'
import { getUserName, modeToOctal, sizeToHuman } from '../src/util.js'
import os from 'os'
import del from 'del'
import chalk from 'chalk'

const { expect } = chai
chai.use(chaiHttp)

describe('Utils', () => {
  it('Converts a permissions bit-field mode to more typical octal representation', (done) => {
    assert.equal(modeToOctal(33188), '0644')
    done()
  })

  it('Converts raw byte size to human-readable format', (done) => {
    assert.equal(sizeToHuman(10000000), '9.54 MB')
    done()
  })
})

describe('API', () => {
  it('Lists top-level directory contents', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem')
      .end((err, res) => {
        expect(res).to.have.status(200)
        expect(res.body.length).to.equal(3)
        done()
      })
  })

  it('Returns contents of individual files', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem/mock-file-2.txt')
      .end((err, res) => {
        expect(res.text).to.contain('hello!')
        done()
      })
  })

  it('Lists files in subdirectories', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem/mock-subdirectory')
      .end((err, res) => {
        expect(res).to.have.status(200)
        expect(res.body.length).to.equal(1)
        done()
      })
  })

  it('Returns accurate filesystem stats about files', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem/mock-subdirectory')
      .end((err, res) => {
        expect(res).to.have.status(200)
        const firstFile = res.body[0]
        expect(firstFile.isDir).to.equal(false)
        expect(firstFile.name).to.equal('mock-file-3.md')
        expect(firstFile.mode).to.equal('0644')
        expect(firstFile.size).to.equal(7)
        done()
      })
  })

  it('Returns accurate filesystem stats about directories', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem')
      .end((err, res) => {
        expect(res).to.have.status(200)
        const subdirectory = res.body.filter(
          (node) => node.name === 'mock-subdirectory'
        )[0]
        expect(subdirectory.isDir).to.equal(true)
        expect(subdirectory.mode).to.equal('0755')
        done()
      })
  })

  it('Returns contents of individual files in subdirectories', (done) => {
    chai
      .request(app)
      .get('/test/mock-filesystem/mock-subdirectory/mock-file-3.md')
      .end((err, res) => {
        expect(res.text).to.contain('howdy!')
        expect(res.header['content-disposition']).to.equal(
          'attachment; filename="mock-file-3.md"'
        )
        done()
      })
  })

  it('Creates a new directory', (done) => {
    const date = new Date()
    const newDirectory = `/test/tmp/${date.toISOString()}`
    chai
      .request(app)
      .post(newDirectory)
      .end((err, res) => {
        expect(res.text).to.contain('200 Created requested directory')
        done()
      })
  })

  it('Does not overwrite existing directory', (done) => {
    const date = new Date()
    const newDirectory = `/test/tmp/${date.toISOString()}`
    // First POST
    chai
      .request(app)
      .post(newDirectory)
      .end((err, res) => {})

    // Second POST should fail
    chai
      .request(app)
      .post(newDirectory)
      .end((err, res) => {
        expect(res.text).to.contain(
          '422 Unprocessable entity: Directory already exists'
        )
        done()
      })
  })

  // Cleanup
  after(async () => {
    const deletedPaths = await del(['test/tmp/*'])
    console.log(chalk.blue('\n  Clean up'))
    console.log(chalk.blue(`    ${deletedPaths.join(' \n    ')}`))
  })
})
