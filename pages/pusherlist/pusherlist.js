// pages/list/list.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cmproxy: null,
    account: null,
    psw: null,
    list: [],
    groupList: []
  },

  starlive: function(id, groupid) {
    console.log("id:"+id+", groupid:"+groupid)
      this.data.cmproxy.start_push_media(id,
        groupid, "90s", function(msg) {
          console.log("startpush return msg:"+msg)
          var jsonResult = JSON.parse(msg)
          var url = jsonResult["result"]["url"]
          console.log(url)
          var arr = url.split('?')
          var arrauth
          if(arr.length > 1) {
            arrauth = arr[1].split('=')
          }
          console.log(arr[0])
          console.log(arrauth[0])
          console.log(arrauth[1])
          wx.navigateTo({
            url: '../player/player?url=' + arr[0]
            + '&auth=' + arrauth[0] + '&key=' + arrauth[1]
            + '&id=' + id + '&gid=' + groupid
          })
      })
  },

  initPullNodes: function () {
    console.log("initPullNodes")
    var that = this
    var list = this.data.list
    this.data.cmproxy.set_nodeslist_change_listener(function (msg) {
      console.log("nodeslist_change return msg:" + msg)
      var jsonList = JSON.parse(msg)
      console.log(jsonList)
      for(var item in jsonList) {
        if (item == "all_online") {
          for (var i = 0; i < jsonList[item].length; i++) {
            list.push(jsonList[item][i])
          }
        } else if (item == "new_online") {
          for (var i = 0; i < jsonList[item].length; i++) {
            list.push(jsonList[item][i])
          }
        } else if (item == "new_offline") {
          for (var i = 0; i < jsonList[item].length; i++) {
            for (var j = 0; j < list.length; j++) {
              if (jsonList[item][i]["id"] == list[j]["id"]) {
                list.splice(j, 1)
              }
            }
          }
        } else if (item == "new_update") {
          for (var i = 0; i < jsonList[item].length; i++) {
            for (var j = 0; j < list.length; j++) {
              if (jsonList[item][i]["id"] == list[j]["id"]) {
                if (jsonList[item][i]["stream_status"] == "publish_done") {
                  var target_id = "notifystoplive" + "_" + jsonList[item][i]["id"] + "_" + jsonList[item][i]["group_id"]
                  console.log(target_id)
                } else if (jsonList[item][i]["stream_status"] == "publish") {
                  var target_id = jsonList[item][i]["id"] + "_" + jsonList[item][i]["group_id"]
                  console.log(target_id)
                }
                list.splice(j, 1)
                list.push(jsonList[item][i])
              }
            }
          }
        }
      }
      that.updateList()
    })
    this.data.cmproxy.connect(this.data.account,
      this.data.account, "Unknow Location", function (msg) {
        console.log("connect msg:" + msg)
      })
  },

updateList: function() {
  var tempdata = this.data
  var templist = tempdata.list.concat()
  var tempGroupList = []
  
  for(let i = 0; i < templist.length; i++) {
    groupfor:
    for(var j = 0; j < tempGroupList.length; j++) {
      if(templist[i]["group_nick"] == tempGroupList[j]["group_nick"]) {
        var deviceList = tempGroupList[j]["devicelist"]
        devicefor:
        for(var k = 0; k < deviceList.length; k++) {
          if (templist[i]["device_name"] == deviceList[k]["device_name"]) {
            let nickList = deviceList[k]["nicklist"]
            for(var m = 0; m < nickList.length; m++) {
              if(templist[i]["nick"] == nickList[m]["nick"]) {
                console.log("pusherlist updateList: there is the same node, ignore")
                this.logfunc("updateList", "duplicate node " + JSON.stringify(templist[i]))
                break groupfor // duplicate
              }
            }
            if(m == nickList.length) {
              var newjsonstr = JSON.stringify(templist[i])
              nickList.push(JSON.parse(newjsonstr)) //add nick
              this.logfunc("updateList", "add nick nickList")
              console.log(nickList)
              break groupfor
            }
          }
        }
        if(k == deviceList.length) {
          var newjsonstr = JSON.stringify(templist[i])
          let nicklisttemp = []
          nicklisttemp.push(JSON.parse(newjsonstr))
          this.logfunc("updatelist", "add device nicklisttemp:")
          console.log(nicklisttemp)

          let devicejson = {}
          devicejson.device_name = templist[i]["device_name"]
          devicejson.nicklist = nicklisttemp
          deviceList.push(devicejson) //add device
          this.logfunc("updatelist", "add device deviceList:")
          console.log(deviceList)
          break groupfor
        }
      }
    }
    if (j == tempGroupList.length) {
      this.logfunc("updateList", "add group j = " + j)
      this.logfunc("updateList", "add group jsonstr " + JSON.stringify(templist[i]))
      var newjsonstr = JSON.stringify(templist[i])
      let nicklisttemp = []
      nicklisttemp.push(JSON.parse(newjsonstr))
      this.logfunc("updatelist", "nicklisttemp:")
      console.log(nicklisttemp)

      let devicejson = {}
      devicejson.device_name = templist[i]["device_name"]
      devicejson.nicklist = nicklisttemp
      let devicelisttemp = []
      devicelisttemp.push(devicejson)
      this.logfunc("updatelist", "devicelisttemp:")
      console.log(devicelisttemp)
      
      let groupjson = {}
      groupjson.group_nick = templist[i]["group_nick"]
      groupjson.devicelist = devicelisttemp
      tempGroupList.push(groupjson)
      this.logfunc("updatelist", "tempGroupList:")
      console.log(tempGroupList)
    }
  }
  this.setData({
    groupList: tempGroupList
  })
},

  listTap(e) {
    let Index = e.currentTarget.dataset.groupindex
    console.log('click group index:'+Index)
    var list = this.data.groupList
    list[Index].show = !list[Index].show || false
    if (!list[Index].show) {
      this.packupinner(list, Index)
    }
    this.setData({
      groupList: list
    })
  },

  //点击里面的子列表展开收起 
  listItemTap(e) {
    let groupindex = e.currentTarget.dataset.groupindex
    //点击的内层所在的最外层列表下标
    let index = e.currentTarget.dataset.deviceindex//点击的内层下标 
    let list = this.data.groupList
    console.log(list[groupindex].devicelist, index)
    list[groupindex].devicelist[index].show = !list[groupindex].devicelist[index].show || false;
    this.setData({
      groupList: list
    });
  },

  nicklistTap: function (e) {
    let groupindex = e.currentTarget.dataset.groupindex
    let deviceindex = e.currentTarget.dataset.deviceindex
    let index = e.currentTarget.dataset.index
    let list = this.data.groupList
    let nickjson = list[groupindex].devicelist[deviceindex].nicklist[index]
    this.starlive(nickjson["id"], nickjson["group_id"])
  },

  // //让所有的展开项，都变为收起
  // packUp(data, index) {
  //   for (let i = 0, len = data.length; i < len; i++) {
  //     //其他最外层列表变为关闭状态 
  //     if (index != i) {
  //       data[i].show = false;
  //       for (let j = 0; j < data[i].item.length; j++) {
  //         //其他所有内层也为关闭状态 
  //         data[i].item[j].show = false;
  //       }
  //     }
  //   }
  // },

  //收起内层
  packupinner(data, index) {
    for (let i = 0, len = data.length; i < len; i++) {
      if (i == index) {
        console.log("packupinner: devicelist length = " + data[i].devicelist.length)
        console.log(data[i].devicelist)
        for (let j = 0; j < data[i].devicelist.length; j++) {
          data[i].devicelist[j].show = false;
        }
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (app.globalData.cmproxy && options != null) {
      this.logfunc("onLoad", "getcmproxy success")
      this.setData({
        cmproxy: app.globalData.cmproxy,
        account: options.account,
        psw: options.psw
      })
      this.initPullNodes()
    } else {
      this.logfunc("onLoad", "getcmproxy failed")
    }
  },

  

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.logfunc("", "onUnload")
    var tempdata = this.data
    if (tempdata.cmproxy != null) {
      tempdata.cmproxy.disconnect(function (msg) {
        console.log("disconnect success")//不生效
      })

      tempdata.cmproxy.logout(tempdata.account, function (msg) {
        console.log("logout success")
        tempdata.cmproxy.close()
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
  
  },

  logfunc: function(tag, logstr) {
    console.log("pusherlist "+tag+": "+logstr)
  }
})