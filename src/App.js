/*
* Copyright (C) 2022 Rastislav Kish
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, version 3.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react'

class Board {

    constructor(width, height, mineCount) {
        this.width=width
        this.height=height
        this.mineCount=mineCount
        this.flagCount=0

        this.board=this.generateBoard(width, height, mineCount)
        }

    at(column, row) {
        console.log(typeof(this.board))
        return this.board[column][row]
        }

    flag(column, row) {
        let cell=this.board[column][row]

        if (!cell.covered)
        return false

        cell.flagged=!cell.flagged

        //Since this method is not going to be called frequently, we'll count the flags to get accurate information

        let flagCount=0
        for (let x=0;x<this.width;x++)
        for (let y=0;y<this.height;y++)
        if (this.board[x][y].flagged)
        flagCount++

        this.flagCount=flagCount

        return true
        }

    uncover(column, row) {
        let cell=this.board[column][row]

        if (!cell.covered || cell.flagged)
        return Board.MOVE_RESULT_INVALID_MOVE

        if (cell.value===-1) {
            //Explosion, uncover the board and return explosion result

            for (let x=0;x<this.width;x++)
            for (let y=0;y<this.height;y++)
            this.board[x][y].covered=false

            return Board.MOVE_RESULT_EXPLOSION
            }

        if (cell.value===0) {
            //We need to floodfill the area to uncover other empty cells

            let stack=[cell]
            while (stack.length>0) {
                let currentCell=stack.pop()

                currentCell.covered=false

                for (const deltaColumn of [-1, 0, 1])
                for (const deltaRow of [-1, 0, 1]) {
                    if (deltaColumn===0 && deltaRow===0)
                    continue

                    let column=currentCell.column+deltaColumn
                    let row=currentCell.row+deltaRow

                    if (column>=0 && column<this.width && row>=0 && row<this.height) {
                        let newCell=this.board[column][row]

                        if (!newCell.covered || newCell.flagged)
                        continue

                        if (newCell.value===0)
                        stack.push(newCell)
                        else
                        newCell.covered=false
                        }
                    }
                }

            if (this.checkVictory())
            return Board.MOVE_RESULT_VICTORY
            else
            return Board.MOVE_RESULT_OK
            }

        cell.covered=false

        if (this.checkVictory())
        return Board.MOVE_RESULT_VICTORY
        else
        return Board.MOVE_RESULT_OK
        }

    generateBoard(width, height, mineCount) {
        const centerColumn=Math.trunc((width-1)/2)
        const centerRow=Math.trunc((height-1)/2)

        //Generate an empty board

        let board=[]

        for (let i=0;i<width;i++) {
            let column=[]

            for (let j=0;j<height;j++)
            column.push(new BoardCell(i, j, 0))

            board.push(column)
            }

        //Place the mines

        for (let i=0;i<mineCount;i++) {
            let mineColumn=-1
            let mineRow=-1

            //Generate until we get a position that's not already occupied and it's further than 1from the center

            do
                {
                mineColumn=this.random(0, width)
                mineRow=this.random(0, height)
                }
            while (board[mineColumn][mineRow].value===-1 || !(Math.abs(mineColumn-centerColumn)>1 && Math.abs(mineRow-centerRow)>1))

            //Place the mine
            board[mineColumn][mineRow].value=-1

            //Increase adjacent squares

            for (const deltaColumn of [-1, 0, 1]) {
                for (const deltaRow of [-1, 0, 1]) {
                    if (deltaColumn===0 && deltaRow===0)
                    continue

                    let column=mineColumn+deltaColumn
                    let row=mineRow+deltaRow

                    if (column>=0 && column<width && row>=0 && row<height)
                    if (board[column][row].value!==-1)
                    board[column][row].value+=1
                    }
                }
            }

        return board
        }
    checkVictory() {
        let uncoveredCellCount=0

        for (let column=0;column<this.width;column++)
        for (let row=0;row<this.height;row++) {
            let cell=this.board[column][row]

            if (!cell.covered && cell.value===-1)
            return false

            if (!cell.covered)
            uncoveredCellCount++
            }

        return uncoveredCellCount===this.width*this.height-this.mineCount
        }

    random(min, max) {
        min=Math.floor(min)
        max=Math.floor(max)

        return Math.floor(Math.abs(max-min)*Math.random())+min
        }

    static MOVE_RESULT_OK=0
    static MOVE_RESULT_VICTORY=1
    static MOVE_RESULT_EXPLOSION=2
    static MOVE_RESULT_INVALID_MOVE=-1

    }
class BoardCell {

    constructor(column, row, value) {
        this.column=column
        this.row=row
        this.value=value
        this.covered=true
        this.flagged=false
        }

    textualDescription() {
        let description="Water"

        if (!this.covered) {
            if (this.value===-1)
            description="Mine"
            else if (this.value===0)
            description="Empty"
            else
            description=this.value.toString()
            }
        else if (this.flagged)
        description="Flag"

        return `${description}, ${BoardCell.coordinatesToString(this.column, this.row)}`
        }
    graphicalDescription() {
        let description="~"

        if (!this.covered) {
            if (this.value===-1)
            description="O"
            else if (this.value===0)
            description=" "
            else
            description=this.value.toString()
            }
        else if (this.flagged)
        description="X"

        return description
        }

    static coordinatesToString(column, row) {
        let letter=String.fromCharCode('A'.charCodeAt()+column)
        return `${letter}${row+1}`
        }
    }

class NewGameDialog extends React.Component {

    state={
        boardWidth: "9",
        boardHeight: "9",
        mineCount: "10",
        }

    render() {
        return (
            <div>
                <h1>New game</h1>
                <p>
                    Board size:
                    <input id="boardWidthTextBox"
                        type="text"
                        onChange={ (event) => this.textBoxChangeHandler(event) }
                        value={ this.state.boardWidth }
                        />
                    X
                    <input id="boardHeightTextBox"
                        type="text"
                        onChange={ (event) => this.textBoxChangeHandler(event) }
                        value={ this.state.boardHeight }
                        />
                    </p>
                <input id="mineCountTextBox"
                    type="text"
                    placeholder="Mine count"
                    onChange={ (event) => this.textBoxChangeHandler(event) }
                    value={ this.state.mineCount }
                    />
                <br />
                <button //playButton
                    disabled={ !this.inputIsValid(this.state) }
                    onClick={ this.playButtonClickHandler }
                    >
                    Play
                    </button>
                </div>
            )
        }

    textBoxChangeHandler=(event) => {
        const stateProperty=event.target.id.slice(0, -7) //To remove TextBox suffix
        const value=event.target.value

        this.setState(state => ({
            [stateProperty]: value,
            }))
        }

    playButtonClickHandler=() => {
        const state=this.state

        if (!this.inputIsValid(state))
        return

        const boardWidth=parseInt(state.boardWidth)
        const boardHeight=parseInt(state.boardHeight)
        const mineCount=parseInt(state.mineCount)

        this.props.onSubmit(boardWidth, boardHeight, mineCount)
        }

    inputIsValid(state) {
        const boardWidth=parseInt(state.boardWidth)
        const boardHeight=parseInt(state.boardHeight)
        const mineCount=parseInt(state.mineCount)

        if (isNaN(boardWidth) || isNaN(boardHeight) || isNaN(mineCount))
        return false

        if (boardWidth<8 || boardHeight<8 || mineCount<1)
        return false

        if (boardWidth>26 || boardHeight>26 || mineCount>boardWidth*boardHeight-9)
        return false

        return true
        }

    }
class VictoryDialog extends React.Component {

    render() {
        return (
            <div>
                <h1>Victory</h1>
                <p>Congratulations! You have won!</p>
                <button //okButton
                    onClick={ this.okButtonClickHandler }
                    >
                    Ok
                    </button>
                </div>
            )
        }

    okButtonClickHandler=() => {
        this.props.onSubmit()
        }
    }
class ExplosionDialog extends React.Component {

    render() {
        return (
            <div>
                <h1>Explosion</h1>
                <p>The square has exploded. You've lost.</p>
                <button //okButton
                    onClick={ this.okButtonClickHandler }
                    >
                    Ok
                    </button>
                </div>
            )
        }

    okButtonClickHandler=() => {
        this.props.onSubmit()
        }
    }

class GameBoardCell extends React.Component {

    render() {
        return (
            <button
                id={ `${BoardCell.coordinatesToString(this.props.boardCell.column, this.props.boardCell.row)}Button` }
                aria-label={ this.props.boardCell.textualDescription() }
                onClick={ this.clickHandler }
                onContextMenu={ this.contextMenuHandler }
                onKeyPress={ this.keyPressHandler }
                onKeyDown={ this.keyDownHandler }
                >
                { this.props.boardCell.graphicalDescription() }
                </button>
            )
        }

    clickHandler=() => {
        this.props.onClick(this.props.boardCell)
        }
    contextMenuHandler=(event) => {
        event.preventDefault()

        this.props.onFlagRequest(this.props.boardCell)

        return false
        }
    keyPressHandler=(event) => {

        if (event.key==="f")
        this.props.onFlagRequest(this.props.boardCell)
        }
    keyDownHandler=(event) => {
        if (event.key==="ArrowLeft")
        this.props.onMoveRequest(this.props.boardCell, [-1, 0])
        else if (event.key==="ArrowRight")
        this.props.onMoveRequest(this.props.boardCell, [1, 0])
        else if (event.key==="ArrowUp")
        this.props.onMoveRequest(this.props.boardCell, [0, 1])
        else if (event.key==="ArrowDown")
        this.props.onMoveRequest(this.props.boardCell, [0, -1])
        }

    }
class GameBoard extends React.Component {

    state={
        board: this.props.board,
        }

    render() {
        let board=this.state.board
        let tableData=[]

        for (let row=board.height-1;row>=0;row--) {
            let tableRow=[]

            for (let column=0;column<board.width;column++)
            tableRow.push(<td>
                <GameBoardCell
                    boardCell={ board.at(column, row) }
                    onClick={ this.gameBoardCellClickHandler }
                    onFlagRequest={ this.gameBoardCellFlagRequestHandler }
                    onMoveRequest={ this.gameBoardCellMoveRequestHandler }
                    />
                </td>)

            tableData.push(<tr>{tableRow}</tr>)
            }

        return (
            <table>
                <tbody>
                    { tableData }
                    </tbody>
                </table>
            )
        }

    gameBoardCellClickHandler=(boardCell) => {
        let moveResult=this.state.board.uncover(boardCell.column, boardCell.row)

        if (moveResult===Board.MOVE_RESULT_INVALID_MOVE)
        return

        this.setState(state => ({
            board: this.state.board,
            }))

        if (moveResult===Board.MOVE_RESULT_VICTORY)
        this.props.onVictory()
        else if (moveResult===Board.MOVE_RESULT_EXPLOSION)
        this.props.onExplosion()
        }
    gameBoardCellFlagRequestHandler=(boardCell) => {
        if (this.state.board.flag(boardCell.column, boardCell.row)) {
            this.setState(state => ({
                board: this.state.board,
                }))

            this.props.onFlagCountChange(this.state.board.flagCount)
            }
        }

    gameBoardCellMoveRequestHandler=(boardCell, direction) => {
        let column=boardCell.column+direction[0]
        let row=boardCell.row+direction[1]

        if (column>=0 && column<this.state.board.width && row>=0 && row<this.state.board.height) {
            let element=document.querySelector(`#${BoardCell.coordinatesToString(column, row)}Button`)
            element.focus()
            }
        }
    }

class RMinesApp extends React.Component {

    constructor(props) {
        super(props)

        this.state={
            board: new Board(9, 9, 10),
            flagCount: 0,
            activeDialog: <NewGameDialog
                onSubmit={ this.newGameDialogSubmitHandler }
                />,
            }
        }

    render() {
        if (this.state.activeDialog===null)
        return (
            <div>
                <h1>RMines</h1>
                <div>
                    <p>{ this.state.flagCount } / { this.state.board.mineCount }</p>
                    </div>
                <GameBoard
                    board={ this.state.board }
                    onVictory={ this.gameBoardVictoryHandler }
                    onExplosion={ this.gameBoardExplosionHandler }
                    onFlagCountChange={ this.gameBoardFlagCountChangeHandler }
                    />
                <div>
                    <button //newGameButton
                        onClick={ this.newGameButtonClickHandler }
                        >
                        New game
                        </button>
                    </div>
                </div>
            )
        else
        return this.state.activeDialog
        }

    newGameButtonClickHandler=() => {
        this.setState(state => ({
            activeDialog: <NewGameDialog
                onSubmit={ this.newGameDialogSubmitHandler }
                />,
            }))
        }

    newGameDialogSubmitHandler=(boardWidth, boardHeight, mineCount) => {
        this.setState(state => ({
            board: new Board(boardWidth, boardHeight, mineCount),
            flagCount: 0,
            activeDialog: null,
            }))
        }
    victoryDialogSubmitHandler=() => {
        this.setState(state => ({
            activeDialog: null,
            }))
        }
    explosionDialogSubmitHandler=() => {
        this.setState(state => ({
            activeDialog: null,
            }))
        }

    gameBoardVictoryHandler=() => {
        this.setState(state => ({
            activeDialog: <VictoryDialog
                onSubmit={ this.victoryDialogSubmitHandler }
                />,
            }))
        }
    gameBoardExplosionHandler=() => {
        this.setState(state => ({
            activeDialog: <ExplosionDialog
                onSubmit={ this.explosionDialogSubmitHandler }
                />,
            }))
        }

    gameBoardFlagCountChangeHandler=(flagCount) => {
        this.setState(state => ({
            flagCount
            }))
        }

    }

export default RMinesApp
