const Controller = require("./controller");
const SpecialistController = require("./specialist.controller");
const moment = require("moment");
const { end } = require("../database/connection");

module.exports = class BookingController extends Controller {

  
  constructor() {

    var table = 'bookings';
    var hidden = [];

    super(table, hidden);

    this.specialistController = new SpecialistController();
  }

  getTodaysBooking = async () => {
    let today = moment(new Date()).format("YYYY-MM-DD");

    let bookings = this.qb.raw(`
      SELECT bookings.*,
        clients.fname as client_fname,
        clients.lname as client_lname,
        specialists.fname as specialist_fname,
        specialists.lname as specialist_lname
      FROM bookings
      LEFT JOIN clients ON clients.id=bookings.client
      LEFT JOIN specialists ON specialists.id=bookings.specialist
      WHERE bookings.date='${today}'
      ORDER BY start_time
    `)

    return bookings;
  }

  getList = async () => {
    let bookings = this.qb.raw(`
      SELECT bookings.*,
        clients.fname as client_fname,
        clients.lname as client_lname,
        specialists.fname as specialist_fname,
        specialists.lname as specialist_lname
      FROM bookings
      LEFT JOIN clients ON clients.id=bookings.client
      LEFT JOIN specialists ON specialists.id=bookings.specialist
      ORDER BY created_at
    `)

    return bookings;
  }

  save = async (req) => {

    let bookingId = req.params.id;
    if(!req.body.booking) {
      return {
        error: "Missing parameter `client`"
      }
    }

    //Create
    if(bookingId === undefined) {
      let booking = req.body.booking;
      booking.created_at = new Date();

      let specialist = await this.$getAvailableSpecialist(booking);
      
      if(specialist.selected) {
        booking.specialist = specialist.id;
        delete booking['serviceId'];
        return await this._add(booking);
      }
      else {
        return specialist.reason;
      }
      
    }
    
    //Update
    else {

      // if(clientId === ":id") {
      //   return {
      //     error: "Missing route parameter `id`"
      //   }
      // }
      // else {

      //   return await this._updateById(clientId, req.body.client);
      // }
    }

    
  }

  $getAvailableSpecialist = async (booking) => {

    let result = {
      selected: null,
      reason: ""
    }

    let available = [];

    let startTime = booking.start_time;
    let endTime = booking.end_time;

    let specialists = await this.specialistController.getSpecialistByService({
      params: {
        id: booking.serviceId
      }
    });

    //Check Specialist Bookings
    for(let specialist of specialists) {
      let res = await this.qb.select().where({
        specialist: specialist.id,
        date: booking.date
      }).call();

      if(res.length === 0) {
        available = [...available, specialist];
      }
      else {
        //Check if schedule is lapsing
        let noLapse = true;
        for(let books of res) {
          let lapsed = this.$checkBookingDate(
            booking.date, 
            books.start_time, 
            books.end_time, 
            startTime, 
            endTime
          );

          if(lapsed) {
            noLapse = false;
            break;
          }
        }

        if(noLapse) {
          available = [...available, specialist];
        }
      }
    }

    if(available.length > 0) {
      result.selected = await this.$getSpecialistByQuota(booking.date, available);
    }
    else {
      if(specialists.length > 0) {
        result.reason = "No available specialist for selected schedule"
      }
      else {
        result.reason = "No available specialist for selected service"
      }
    }

    return result;
  }

  /**
   * Check if date is lapsing
   * 
   * @param {string} date 
   * @param {string} start1 
   * @param {string} end1 
   * @param {string} start2 
   * @param {string} end2 
   * @returns 
   */
  $checkBookingDate = (date, start1, end1, start2, end2) => {

    var a_start = moment(`${date} ${start1}`).toDate();
    var b_start = moment(`${date} ${start2}`).toDate();

    var a_end = moment(`${date} ${end1}`).toDate();
    var b_end = moment(`${date} ${end2}`).toDate();
    
    if (a_start >= b_start && b_end > a_start) return true;
    if (b_start > a_start && b_start < a_end ) return true;

    if (a_end <= b_end && b_start < a_end) return true;
    if (b_end > a_end && b_end < a_end) return true;

    if (a_start < b_start && b_start < a_end) return true;
    if (a_start < b_end   && b_end  < a_end) return true;
    if (b_start <  a_start && a_end  <  b_end) return true;
    return false;

  }

  $getSpecialistByQuota = async (date, specialists) => {
    let selected = null;

    for(let specialist of specialists) {
      let res = await this.qb.raw(`
        SELECT * FROM specialist_logs
        WHERE specialist = ${specialist.id} AND date='${date}';
      `)

      if(res.length > 0) {
        specialist.quota = res[0].quota;
        specialist.time_in = res[0].time_in;
      }
      else {
        specialist.quota = 0;
        specialist.time_in = null;
      }

      if(selected === null) {
        selected = specialist;
      }
      else {
        //Check quota
        if(specialist.quota < selected.quota) {
          //Check time in
          if(specialist.time_in) {
            if(selected.time_in) {
              if(selected.time_in > specialist.time_in) {
                selected = specialist;
              }
            }
            else {
              selected = specialist;
            }
          }
        }
      }
    }

    return selected;
  }
  
}