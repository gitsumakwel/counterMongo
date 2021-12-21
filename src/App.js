
import './App.css';
import React from 'react';
import $ from 'jquery';

class Counter extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      count: 0,
    }
  }

   addCount = async() => {
     const counter = await $.get('api/counter/add')
     await this.setState({count:counter.count})
  }

  subCount = async() => {
   const counter = await $.get('api/counter/sub')
   await this.setState({count:counter.count})
  }

  resetCount = async() => {
   const counter = await $.get('api/counter/reset')
   await this.setState({count:counter.count})
  }

  latestCount = async () =>{
    const counter = await $.get('api/counter/latest')
    this.setState({count:counter.count})
  }

  keydown = async (event) => {
    switch (event.which) {
      case 107:
        await this.addCount()
        break;
      case 109:
        await this.subCount()
        break;
      default:
        break;
    }
  }

  componentDidMount(){
    $('#reset').click(this.resetCount)
    $('#increment').click(this.addCount)
    $('#decrement').click(this.subCount)
    $(document).keydown(this.keydown)
    this.latestCount()
  }

  render(){
    return(
      <>
        <div className="countercontent">
          <div className="center">
            <div id="value"><h1>{this.state.count}</h1></div>
            <div className="counterbtns">
              <button id="reset">reset</button>
              <button id="decrement">-</button>
              <button id="increment">+</button>
            </div>
          </div>
        </div>
      </>
    )
  }
}




export default Counter;
