exports.seed = function(knex, Promise) {
  return new Promise(async (resolve, reject) => {
    const [fantasy_id, fergenles_id, scifi_id] = await knex("genres")
      .insert([{ name: "Fantasy" }, { name: "French Poetry" }, { name: "Science Fiction" }])
      .returning("id");

    const [patRothfuss_id, benBova_id, bobBillings_id, isaacAsimov_id] = await knex("authors")
      .insert([
        { first_name: "Patrick", family_name: "Rothfuss", date_of_birth: "1973-06-05", date_of_death: null },
        { first_name: "Ben", family_name: "Bova", date_of_birth: "1932-11-08", date_of_death: null },
        { first_name: "Bob", family_name: "Billings", date_of_birth: null, date_of_death: null },
        { first_name: "Isaac", family_name: "Asimov", date_of_birth: "1920-01-01", date_of_death: "1992-04-05" }
      ])
      .returning("id");

    const [kingkiller1_id, kingkiller2_id, kingkillerChron_id, apesAngels_id, deathWave_id, test2_id] = await knex(
      "books"
    )
      .insert([
        {
          title: "The Name of the Wind (The Kingkiller Chronicle, #1)",
          author_id: patRothfuss_id,
          summary: "I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon.",
          isbn: 9781473211896,
          genre_id: fantasy_id
        },
        {
          title: "The Wise's Man Fear (The Kingkiller Chronicle, #2)",
          author_id: patRothfuss_id,
          summary:
            "Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic...",
          isbn: 9788401352836,
          genre_id: fantasy_id
        },
        {
          title: "The Slow Regard of Silent Things (Kingkiller Chronicle)",
          author_id: patRothfuss_id,
          summary:
            "Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms.",
          isbn: 9780756411336,
          genre_id: fantasy_id
        },
        {
          title: "Apes and Angels",
          author_id: benBova_id,
          summary: "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity.",
          isbn: 9780765379528,
          genre_id: scifi_id
        },
        {
          title: "Death Wave",
          author_id: benBova_id,
          summary:
            "In Ben Bovas previous novel New Earth, Jordan Kell led the first human mission beyond the solar system.",
          isbn: 9780765379504,
          genre_id: scifi_id
        },
        {
          title: "Test Book 2",
          author_id: bobBillings_id,
          summary: "Summary of test book 2",
          isbn: 222222222,
          genre_id: null
        }
      ])
      .returning("id");

    await knex("bookinstances").insert([
      { due_date: "2018-12-22", imprint: "Gollancz, 2011.", book_id: kingkiller1_id, status: "Loaned" },
      { due_date: null, imprint: "London Gollancz, 2014.", book_id: kingkiller2_id, status: "Loaned" },
      {
        due_date: null,
        imprint: "New York Tom Doherty Associates, 2016.",
        book_id: apesAngels_id,
        status: "Available"
      },
      {
        due_date: null,
        imprint: "New York Tom Doherty Associates, 2016.",
        book_id: apesAngels_id,
        status: "Available"
      },
      { due_date: null, imprint: "New York Tom Doherty Associates, 2016.", book_id: deathWave_id, status: "Available" },
      { due_date: "2018-12-22", imprint: "Imprint XXX3", book_id: kingkiller1_id, status: "Maintenance" },
      {
        due_date: "2018-12-22",
        imprint: "New York, NY Tom Doherty Associates, LLC, 2015.",
        book_id: deathWave_id,
        status: "Loaned"
      },
      { due_date: "2018-12-22", imprint: "Imprint XXX2", book_id: kingkiller2_id, status: "Maintenance" }
    ]);
    resolve();
  });
};
