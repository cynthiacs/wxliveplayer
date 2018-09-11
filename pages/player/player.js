// pages/player/player.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cmproxy: null,
    id: null,
    groupid: null,
    liveSource: ''
  },

  statechange(e) {
    console.log('livePlayer code', e.detail.code)
    if(e.detail.code == 2103) {
      wx.navigateBack({
      })
    }
  },

  error(e) {
    console.error('livePlayer error', e.detail.errMsg)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      cmproxy: app.globalData.cmproxy,
      liveSource: options.url+'?'+options.auth+'='+options.key,
      id: options.id,
      groupid: options.gid
    })
    wx.setNavigationBarTitle({
      title: options.devicename + ' ' + options.nick ,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.ctx = wx.createLivePlayerContext('mylive')
    console.log("liveSource:"+this.data.liveSource)
    
  },

  startplayer:function() {
    this.ctx.play({
      success: res => {
        console.log('play success')
      },
      fail: res => {
        console.log('play fail')
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("player:onShow")
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("player:onHide")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("player:onUnload")
    this.ctx.stop({
      success: res => {
        console.log('stop success')
      },
      fail: res => {
        console.log('stop fail')
      }
    })
    let tempdata = this.data
    if (tempdata.cmproxy != null) {
      tempdata.cmproxy.stop_push_media(tempdata.id,
        tempdata.groupid, function (msg) {
          console.log("stop_push_media:"+msg)
        })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})