/* eslint-disable prettier/prettier */
import { Injectable, } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
@Injectable()
export class NotificationService {

    private readonly api_url = 'https://onesignal.com/api/v1/notifications';

    async sendOSNotification(deviceId: string, title: string, message: string): Promise<any> {
        const api_key = process.env.ONESIGNAL_KEY || "";
        const app_id = process.env.ONESIGNAL_APP || "";

        const notificationData = {
            app_id,
            include_player_ids: [deviceId],
            headings: {
                en: title
            },
            contents: {
                en: message,
            }
        };

        const headers = {
            Authorization: `Basic ${api_key}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        const axiosConfig: AxiosRequestConfig = {
            headers,
        };

        try {
            const response = await axios.post(this.api_url, notificationData, axiosConfig);

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`OneSignal API returned status ${response.status}`);
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

}

