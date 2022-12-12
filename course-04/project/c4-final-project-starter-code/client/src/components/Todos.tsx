import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Label,
  Item, 
  Form
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo, getUploadUrl, uploadFile } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  newTodoDetail: string
  loadingTodos: boolean
  file: any
  uploadState: UploadState
}

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    newTodoDetail: '',
    loadingTodos: true,
    file: undefined,
    uploadState: UploadState.NoUpload
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleDetailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoDetail: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  onTodoCreate = async () => {
    try {
      this.setState({
        loadingTodos: true
      })
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        detail: this.state.newTodoDetail,
        dueDate
      })

      if (this.state.file) {
        this.setUploadState(UploadState.FetchingPresignedUrl)
        console.log('newId: ', newTodo.todoId)
        const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), newTodo.todoId)

        this.setUploadState(UploadState.UploadingFile)
        const uploaded = await uploadFile(uploadUrl, this.state.file)
        console.log(uploaded)
      }
      
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false,
        newTodoName: "",
        newTodoDetail: "",
      })

    } catch(e) {
      console.log(e)
      this.setState({
        loadingTodos: false
      })
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        detail: todo.detail,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  renderCreateTodoInput() {
    return (
      <Grid divided='vertically'>
        <Grid.Row>
          <Grid.Column width={16}>
            <Form >
              <Form.Field>
                <label>Task Name</label>
                <Input
                  placeholder="To change the world..."
                  value={this.state.newTodoName}
                  onChange={this.handleNameChange}
                />
              </Form.Field>
              <Form.Field>
                <label>Detail</label>
                <Input
                  value={this.state.newTodoDetail}
                  placeholder="Description detail ..."
                  onChange={this.handleDetailChange}
                />
              </Form.Field>
              <Form.Field>
              <label>Cover</label>
              <input
                    type="file"
                    accept="image/*"
                    placeholder="Image to upload"
                    onChange={this.handleFileChange}
                  />
              </Form.Field>
              <Button onClick={() => this.onTodoCreate()} disabled={this.state.loadingTodos} color='green'>Create</Button>
            </Form>
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      
      <Grid padded>
        <Item.Group>
        {this.state.todos.map((todo, pos) => {
          return(
            <Item>
              {todo.attachmentUrl && (<Item.Image size='small' src={todo.attachmentUrl} />)}
              <Item.Content>
                <Item.Header as='a'>{todo.name}</Item.Header>
                <Item.Description>{todo.detail}</Item.Description>
                <Item.Description>{todo.dueDate}</Item.Description>
                <Item.Extra>
                <Checkbox
                    onChange={() => this.onTodoCheck(pos)}
                    checked={todo.done}
                  />
                <Button
                    icon
                    color="blue"
                    onClick={() => this.onEditButtonClick(todo.todoId)}
                  >
                    <Icon name="pencil" />
                  </Button>
                  <Button
                    icon
                    color="red"
                    onClick={() => this.onTodoDelete(todo.todoId)}
                  >
                    <Icon name="delete" />
                  </Button>
                </Item.Extra>
              </Item.Content>
            </Item>)
        })}
        </Item.Group>
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
