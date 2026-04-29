export default function getTodayDate() {
  const today = new Date();

  let day = today.getDate();
  let month = today.getMonth() + 1;
  const year = today.getFullYear();

  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;
  const formattedToday = `${day}.${month}.${year}`;

  return formattedToday;
}
