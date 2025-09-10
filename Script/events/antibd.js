module.exports.config = {
  name: "antibd",
  eventType: ["log:user-nickname"],
  version: "0.0.1",
  credits: "𝗜𝘀𝗹𝗮𝗺𝗶𝗰𝗸 𝗰𝗵𝗮𝘁 𝗯𝗼𝘁",
  description: "Against changing Bot's nickname"
};

module.exports.run = async function({ api, event, Users, Threads }) {
    // Automatic nickname protection has been disabled
    // If you want to enable it again, restore the original code
    return;
}
