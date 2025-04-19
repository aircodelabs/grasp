import { io } from "socket.io-client";

const socket = io("/web");

export default socket;
