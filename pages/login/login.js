// pages/login/login.js
// const cm = require('../../utils/cmproxy.js')
// const cmproxy = new cm.CMProxy()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: 'A491625',
    psw: '123456',
    cmproxy: null,
    haslogined: false,
    hasshow: false,
    hashide: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onLoad")
    if (app.globalData.cmproxy) {
      console.log("getcmproxy success")
      this.setData({
        cmproxy: app.globalData.cmproxy
      })
    } else {
      console.log("getcmproxy failed")
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onReady")
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // console.log("onShow:haslogined = "+this.data.haslogined)
    // var tempdata = this.data
    // if (tempdata.haslogined && tempdata.cmproxy != null) {
    //   tempdata.cmproxy.logout(tempdata.username, function(msg){
    //     console.log("logout success")
    //     tempdata.haslogined = false
    //     tempdata.cmproxy.close()
    //   })
    // }
  },

  userInput: function (e) {
    this.setData({
      username: e.detail.value
    })
  },

  pswInput: function (e) {
    this.setData({
      psw: e.detail.value
    })
  },

  login: function () {
    if (this.data.username.length == 0 || this.data.psw.length == 0) {
      wx.showToast({
        title: '用户名和密码不能为空',
        icon: 'none'
      })
    } else {
      var tempThis = this.data;
      this.data.cmproxy.set_onopen(function () {
        console.log("websocket onopen")
        tempThis.cmproxy.login(tempThis.username,
         tempThis.psw, function (msg){
          console.log("login return")
           tempThis.haslogined = true
          wx.navigateTo({
            url: '../pusherlist/pusherlist?account=' + tempThis.username
              + '&psw=' + tempThis.psw,
          })
        })
      })
      this.data.cmproxy.set_onclose(function () {
        console.log("websocket onclose")
      })
      this.data.cmproxy.set_onerror(function () {
        console.log("websocket onerror")
      })

      this.data.cmproxy.ws_connect('www.yangxudong.com', '9001')
      console.log("after connect")

    }
  },



  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("on hide")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("onUnload")
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("onPullDownRefresh")
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("onReachBottom")
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log("onShareAppMessage")
  }
})