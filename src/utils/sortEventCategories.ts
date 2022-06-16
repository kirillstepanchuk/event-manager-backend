function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

interface Event {
  id: number,
  title: string,
  description: string,
  date: Date
  time: Date
  ticketTypes: string
  category: string
  location: {
    longtitude: string
    latitude: string
  }
  preview: Blob
  isApproved: boolean
  position: number
}

interface EventCategory {
  category: string
  eventCards: Event[]
}

const sortEventCategories = (categories: string[],
  results: Event[],
  adEvents?: EventCategory[]): EventCategory[] => {
  const unique = categories.filter(onlyUnique);
  const events = [];

  for (let i = 0; i < unique.length; i++) {
    events[i] = {
      category: unique[i],
      eventCards: [],
    };
    if (adEvents) {
      const eventsWithAd = adEvents.find((elem) => elem.category === events[i].category);
      if (eventsWithAd) {
        events[i].eventCards = eventsWithAd.eventCards;
      }
    }
    for (let j = 0; j < results.length; j++) {
      if (results[j].category === unique[i] && events[i].eventCards.length < 4) {
        events[i].eventCards.push(results[j]);
      }
    }
  }

  return events;
};

export default sortEventCategories;
