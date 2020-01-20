import React from "react";
import axios from "axios";
import { Layout, Row, Col } from "antd";
import Side from "./sider/Sider";
import Nav from "./display/nav";
import MessageList from "./display/MessageList";
import InputMsg from "./display/inputMsg";
import Thread from "./display/Thread";
import MemberList from "./display/MemberList";
import UserProfile from "./display/UserProfile";
import './Main.css'
// import "antd/dist/antd.css";

class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channels: [],
      dms: [],
      currentDisplay: null, //<- 객체형식으로 나중에 채워짐
      //msgs의 res 형식: [{id, user:{id, name, email}, createdAt, updatedAt, message, clicked, replyCount}]
      msgs: [
        //<- 현재는 mock data, default는 빈 배열 형식
      ],
      clickedMsg: [],
      replies: [], //객체 형태 {id, reply, createdAt, user:{id, name, email}}
      memberList: [
        //<- 현재는 mock data, default는 빈 배열 형식
      ],
      filteredMembers: null, //배열 안에 객체 형식
      clickedUser: null, //객체 형식
      createdReply: false,
    };
    this.makeNoReplyMessage = this.makeNoReplyMessage.bind(this);
    this.handleClickReply = this.handleClickReply.bind(this);
    this.handleReplyClose = this.handleReplyClose.bind(this);
    this.handleClickMemberList = this.handleClickMemberList.bind(this);
    this.handleMemberListClose = this.handleMemberListClose.bind(this);
    this.handleClickProfile = this.handleClickProfile.bind(this);
    this.handleProfileClose = this.handleProfileClose.bind(this);
    this.handleCreateReply = this.handleCreateReply.bind(this);
    this.clickedMsgUpdate = this.clickedMsgUpdate.bind(this);
    this.getCN = this.getCN.bind(this);
    this.setCurrentDisPlay = this.setCurrentDisPlay.bind(this);
    this.clickedChannel = this.clickedChannel.bind(this)
  }

  // Methods
  makeNoReplyMessage(messageObj) {
    const newMessageArr = [];
    const obj = {};
    for (const key in messageObj) {
      obj[key] = messageObj[key];
    }
    newMessageArr.push(obj);
    newMessageArr.map(message => {
      delete message.replyCount;
      return message;
    });
    return newMessageArr;
  }

  clickedMsgUpdate() {
    const clicked = this.state.msgs.filter(msg => msg.clicked);
    if (clicked.length && this.state.clickedMsg[0] !== clicked[0]) {
      this.setState({
        clickedMsg: clicked,
      });
    }
  }

  async clickedChannel(id) {
    console.log("채널이클릭되었습니다 : ", id);
    let allCN = this.state.channels
    let findCN = allCN.filter(val => {
      if(val.id === id) {
        return val
      }
    })
    await this.setState({currentDisplay: findCN[0] , msgs:[]})

    await axios
    // create dm api 생성 후 채널인지 dm인지 분기하는 코드 필요
    .get(
      `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/channelmessage/${this.state.currentDisplay.id}/list`,
      {
        withCredentials: true, // 쿠키전달
      },
    )
    .then(res => {
      console.log("채널에 메시지 겟요청", res);
      if (res.data.length !== 0) {
        this.setState({ msgs: res.data });
      } else {
        console.log("메세지가 비어있습니다.");
      }
    });
    
  };

  setCurrentDisPlay = (e) => {
    console.log(e)
  }

  handleClickReply(msgId) {
    axios
      .get(
        `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/channelmessage/${this.state.currentDisplay.id}/${msgId}/list`,
        {
          withCredentials: true,
        },
      )
      .then(res =>
        this.setState({
          msgs: this.state.msgs.map(msg => {
            if (msg.id === msgId) {
              msg.clicked = true;
            }
            return msg;
          }),
          replies: res.data,
          filteredMembers: null,
          clickedUser: null,
        }),
      )
      .catch(err => {
        console.log("새로고침에러4")
        console.log(err)

      });
  }

  handleReplyClose() {
    const renewMsgs = this.state.msgs.map(msg => {
      if (msg.clicked) {
        msg.clicked = false;
      }
      return msg;
    });
    this.setState({ msgs: renewMsgs, clickedMsg: [], replies: [] });
  }

  handleClickMemberList() {
    let currentId = this.state.currentDisplay.id;
    let filteredMembers = this.state.memberList.filter(
      member => member.id === currentId,
    );
    console.log("필터된 멤버들 =", filteredMembers);
    this.setState({
      filteredMembers: filteredMembers,
      clickedMsg: [],
      clickedUser: null,
    });
  }

  handleMemberListClose() {
    this.setState({ filteredMembers: null });
  }

  handleClickProfile(userId) {
    console.log("유저 프로필 클릭함", userId);
    axios
      .get(
        `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/user/profile/${userId}`,
        {
          withCredentials: true, // 쿠키전달
        },
      )
      .then(res =>
        this.setState({
          clickedUser: res.data,
          clickedMsg: [],
          filteredMembers: null,
        }),
      );
  }

  handleProfileClose() {
    this.setState({ clickedUser: null });
  }

  handleCreateReply() {
    this.setState({
      createdReply: true,
      clickedUser: null,
      filteredMembers: null,
    });
  }

  // 워크스페이스 아이디로 채널불러오는 api요청
  getCN =()=> {
     axios
        .get(
          `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/channel/list`,
          {
            withCredentials: true, // 쿠키전달
          },
        )
        .then(res => {
          console.log("채널받아오는 API",res)
          this.setState({ channels: res.data, currentDisplay: res.data[0] });
        });
  }

  // LifeCycle
  async componentDidMount() {
    // 워크스페이스 아이디로 채널이랑 (디엠)을 다 불러온다 -> SETSTATE를 해주면 된다. + currentDisplay에 채널의 0번째 껄 셋스테이트한다.
    // try {
    try {
      await axios
      .get(
        `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/channel/list`,
        {
          withCredentials: true, // 쿠키전달
        },
      )
      .then(res => {
        console.log("채널받아오는 API",res)
        this.setState({ channels: res.data, currentDisplay: res.data[0] });
      });

      await axios
        // create dm api 생성 후 채널인지 dm인지 분기하는 코드 필요
        .get(
          `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/channelmessage/${this.state.currentDisplay.id}/list`,
          {
            withCredentials: true, // 쿠키전달
          },
        )
        .then(res => {
          console.log("채널에 메시지 겟요청", res);
          if (res.data.length !== 0) {
            this.setState({ msgs: res.data });
          } else {
            console.log("메세지가 비어있습니다.");
          }
        });

      // 멤버리스트 받아오는 api 추가

      await axios
        .get(
          `${process.env.REACT_APP_DEV_URL}/${this.props.currentWorkspace[0].code}/user/list`,
          {
            withCredentials: true, // 쿠키전달
          },
        )
        .then(res => {
          console.log("참여 중인 유저들 =", res.data);
          this.setState({ memberList: res.data });
        });
    } catch (err) {
      console.log("새로고침에러5")
      console.log(err);
      axios
      .post(`${process.env.REACT_APP_DEV_URL}/user/signout`, null, {
        withCredentials: true,
      })
      .then(result => {
        console.log("로그아웃 결과", result);
        this.setState({ isLogin: false });
      })
      .catch(err => {
        console.log("새로고침에러3");
        console.log(err);
      });
    }
  }

  componentDidUpdate() {
    console.log("update");
    const clicked = this.state.msgs.filter(msg => msg.clicked);
    if (clicked.length && this.state.clickedMsg[0] !== clicked[0]) {
      this.setState({
        clickedMsg: clicked,
      });
    }
  }

  render() {
    console.log("로그인상태? : ", this.props.isLogin);
    const { currentWorkspace } = this.props;
    const {
      channels,
      dms,
      currentDisplay,
      msgs,
      clickedMsg,
      replies,
      filteredMembers,
      clickedUser,
      createdReply,
    } = this.state;
    const { Footer, Content } = Layout;
    const {
      makeNoReplyMessage,
      handleClickReply,
      handleReplyClose,
      handleClickMemberList,
      handleMemberListClose,
      handleClickProfile,
      handleProfileClose,
      handleCreateReply,
    } = this;

    return (
      // 로그인 뿐만 채널 or 디엠 null
      this.props.isLogin &&
        (this.state.channels.length || this.state.dms.length) ? (
        <div className="main-container">
          <Row
            style={{
              zIndex: 3,
            }}
          >
            <Col
              span={3}
              style={{
                height: "100%",
                backgroundColor: "#400d3f",
                // borderStyle: "solid",
                // borderWidth: "0.5px",
              }}
            >
              Side_Header
            </Col>
            <Col
              span={21}
              style={{
                height: "100%",
                backgroundColor: "white",
                borderColor: "#bdc3c7",
                borderStyle: "solid",
                borderWidth: "0.5px",
                position:"sticky" ,top: 0 
              }}
            >
              <Nav
                msgs={msgs}
                props={this.props}
                state={this.state}
                channels={channels}
                handleClickMemberList={handleClickMemberList}
              />
            </Col>
          </Row>
          <Row style={{ height:"940px" , overflow:"hidden" }}>
            <Col span={3} style={{ height: "100%" }}>
              <Side channels={channels} dms={dms} currentWorkspace={currentWorkspace} clickedChannel={this.clickedChannel} />
            </Col>
            <Col
              span={
                clickedMsg.length || filteredMembers || clickedUser ? 15 : 21
              }
              style={{ height: "100%" }}
            >
              <Layout className="main-layout" style={{ height: "100%" }}>
                <Content className="main-layout-content" style={{overflow:"scroll"}}>
                  {msgs.length ? (
                    <MessageList
                      msgs={msgs}
                      handleClickReply={handleClickReply}
                      handleClickProfile={handleClickProfile}
                      handleCreateReply={handleCreateReply}
                    />
                  ) : (
                    <div>아직 메시지가 없습니다.</div>
                  )}
                </Content>
                <Footer
                  style={{
                    backgroundColor: "#ecf0f1",
                    position: "sticky",
                    bottom: 0,
                    width: "100%",
                    padding: 0,
                  }}
                >
                  <InputMsg
                    props={this.props}
                    currentDisplay={this.state.currentDisplay}
                  />
                </Footer>
              </Layout>
            </Col>
            <Col span={6} style={{ height: "100%" }}>
              {clickedMsg.length || createdReply ? (
                <Thread
                  currentWorkspace={currentWorkspace}
                  currentDisplay={currentDisplay}
                  clickedMsg={clickedMsg}
                  replies={replies}
                  makeNoReplyMessage={makeNoReplyMessage}
                  handleClickReply={handleClickReply}
                  handleReplyClose={handleReplyClose}
                  handleClickProfile={handleClickProfile}
                  handleClickMemberList={handleClickMemberList}
                />
              ) : filteredMembers ? (
                <MemberList
                  filteredMembers={filteredMembers}
                  handleClickProfile={handleClickProfile}
                  handleMemberListClose={handleMemberListClose}
                />
              ) : clickedUser ? (
                <UserProfile
                  clickedUser={clickedUser}
                  handleProfileClose={handleProfileClose}
                  // dm 생성 함수 부분도 나중에 props로 내리기
                />
              ) : (
                <Row></Row>
              )}
            </Col>
          </Row>
        </div>
      ) : (
        // loading state
        <div>Loading...</div>
      )
    );
  }
}

export default MainPage;
